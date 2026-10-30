---
number: "013"
title: "Pluggable component systems and hot reloading"
kind: guide
issued: "2026-08-27"
author: W. Schenk
status: Current
verified: "2026-08-27"
---

> `@umwelten/substrate` is the reference implementation. The lifecycle principles apply to any
> pluggable system that must add, remove and replace behavior without leaving partial state behind.

# Pluggable component systems and hot reloading

A pluggable system is more than dynamic import. It needs a lifecycle that makes every installation
reversible, activates a component only when its dependencies are present, and replaces code without
breaking the working version when a new module cannot load. The same model applies to browser
panels, server integrations, agent tools and long-lived resources.

`@umwelten/substrate` provides an isomorphic, zero-dependency reference: contexts own effects,
service keys connect providers to consumers, component specs describe activation, fibers represent
mounted instances, and `Loader` reconciles a host manifest. The package is currently a private
workspace package in The-Focus-AI/umwelten; treat the examples as the present repository API rather
than a published compatibility promise.

## 1. The lifecycle model

A component is a declarative spec, not a singleton object. Mounting creates a fiber with its own
owner context. The fiber activates when every injected service is available and receives a committed
view of those exact service values. Withdrawing one dependency deactivates the fiber; providing it
again creates a fresh activation. Explicit unmount is different: it is permanent and idempotent.

```ts
import {
  createContext,
  Loader,
  mount,
  serviceKey,
  type ComponentSpec,
} from "@umwelten/substrate";

interface Database {
  subscribe(onRow: (row: unknown) => void): () => void;
}

const database = serviceKey<Database>("database");
const events: string[] = [];

const results: ComponentSpec<{ query: string }> = {
  name: "results",
  inject: [database],
  apply(ctx, view, config) {
    const db = view.get(database);

    ctx.effect(() => {
      const unsubscribe = db.subscribe((row) => {
        events.push(`${config.query}:${String(row)}`);
      });
      return unsubscribe;
    });

    events.push("active");
    return () => events.push("inactive");
  },
};

const root = createContext();
const fiber = mount(root, results, { query: "open invoices" });
await fiber.settled();
console.assert(!fiber.active && fiber.missing[0] === database);

const withdrawDatabase = root.provide(database, myDatabase);
await fiber.settled();
console.assert(fiber.active);

await withdrawDatabase();
await fiber.settled();
console.assert(!fiber.active);

root.provide(database, replacementDatabase);
await fiber.settled();
console.assert(fiber.active);

await fiber.unmount();
await fiber.unmount(); // Permanent and idempotent; it cannot reactivate.
await root.dispose();
```

Read injected services from the committed `view`, not with a new `ctx.get()`. The view keeps setup
and teardown tied to the same values even while a provider is leaving. A realm permits one provider
for a service key at a time; withdrawing it first allows another value to take its place.

Transitions on one fiber serialize. If a dependency disappears during an asynchronous `apply`, the
activation finishes against its committed view and deactivation follows; setup and teardown do not
interleave into a half-mounted fiber. A failed activation reverses partial effects, leaves the fiber
inactive and records the failure in `fiber.error`. Use `await fiber.settled()` whenever following
work depends on the current transition being complete.

## 2. Reversible effects and ownership

Everything installed during activation needs an inverse: event listeners, timers, service
provisions, subscriptions, child mounts and backend registrations. `ctx.effect(callback)` runs the
callback immediately and tracks its returned inverse. `apply` may also return an inverse. Both may
be asynchronous.

Cleanup is LIFO. The inverse returned by `apply` is registered after effects created inside `apply`,
so it runs first, followed by `ctx.effect` inverses in reverse registration order. Cleanup continues
after an inverse fails and reports one error or an aggregate rather than abandoning the remaining
recovery.

Mount a child on the activation context when its lifetime belongs to that activation:

```ts
const child: ComponentSpec = {
  name: "child",
  apply() {
    events.push("child up");
    return () => events.push("child down");
  },
};

const parent: ComponentSpec = {
  name: "parent",
  inject: [database],
  apply(ctx) {
    mount(ctx, child);
    events.push("parent up");
    return () => events.push("parent down");
  },
};
```

Deactivating or unmounting the parent cascades through children owned by that activation. Child
teardown completes before parent teardown; sibling effects and child contexts otherwise follow LIFO
order. Disposing the context on which a fiber was mounted also unmounts it.

The general principle is ownership: install an effect on the narrowest context that completely owns
its lifetime. Then dependency loss, manifest removal, hot replacement and process shutdown all use
the same recovery path.

## 3. Isolation realms

Context children ordinarily share a root service registry. `isolate(key)` gives one subtree a fresh
realm for that key while other keys continue to resolve normally. Descendants inherit the nearest
override. A named realm lets separate subtrees intentionally share one isolated binding.

```ts
const tenantA = root.child();
tenantA.isolate(database); // Install before provide, declare or mount.
tenantA.provide(database, tenantADatabase);
mount(tenantA, results, { query: "tenant A invoices" });

const tenantB = root.child();
tenantB.isolate(database, "tenant-b");
tenantB.provide(database, tenantBDatabase);
mount(tenantB, results, { query: "tenant B invoices" });
```

Providers and declarations capture their resolved realms when created, so isolation is configured
before provisioning or mounting; changing an override does not migrate existing bindings. Changes
in one realm notify only declarations bound to that realm, and an isolated declaration does not fall
back to the default provider.

This is dependency-resolution isolation, not a security boundary. Components in one JavaScript
process remain trusted code with the process's authority. Use a process boundary or sandboxed iframe
for untrusted UI, and enforce authorization at the host that crosses that boundary.

## 4. Manifest reconciliation and hot replacement

The host owns file watching and manifest polling. `Loader` owns keyed reconciliation and component
lifecycle. Entries have stable, unique `id` values and either a module `url` or an inline
`component`; `config` and `disabled` control realization.

```ts
const loader = new Loader(root);

await loader.apply([
  { id: "results", url: "/components/results.js", config: { query: "open" } },
  { id: "status", component: statusComponent },
  { id: "debug", url: "/components/debug.js", disabled: true },
]);

await loader.reload("results");

for (const entry of loader.entries()) {
  console.log(entry.id, entry.generation, entry.fiber?.active, entry.error);
}
```

`apply()` first retires IDs absent from the desired manifest, then adds or reconciles desired
entries in order. Unchanged entries preserve the same fiber. Added entries mount and settle;
disabled entries remain known without a fiber; removed entries dispose their per-entry context and
settle teardown. A changed URL, config, disabled flag or inline component is retired and then
realized. Entry IDs therefore need to be unique even though the current Loader does not reject
duplicates itself.

Hot replacement of a URL entry uses `reload(id)`, which is deliberately import-before-retire:

```text
import and validate generation N+1
  ├─ failure → record error; keep generation N mounted
  └─ success → settle unmount of N; mount and settle N+1
```

The replacement module must default-export a component spec. A failed import or invalid export
advances the generation for the next cache-busting URL, records the error, and resolves while the old
fiber remains active. This is transactional protection for import and export validation. Once import
succeeds, a later teardown or activation failure does not roll back to the old fiber. Inline
`reload()` and manifest changes handled by `apply()` are retire-before-realize, not transactional hot
replacement.

Loader work within one `apply()` or `reload()` call is sequential and awaits fiber settlement. The
Loader has no global mutex, so the host serializes calls rather than starting overlapping polls or
reloads. A typical host compares its own manifest version or file modification time, calls
`loader.apply(entries)`, then awaits `loader.reload(id)` for changed URL entries. `version` is host
metadata, not a current Loader `Entry` field.

These distinctions preserve the useful guarantee without overstating it: broken code discovered at
import time leaves the working component active; arbitrary replacement failures are not fully
rollback-safe.

## 5. Local composition and wire projection

Within one trusted runtime, components, services and effects compose as local typed values. A server
component can own a database pool, provide a narrow service to dependent server components, and let
dependency draining stop consumers before pool cleanup:

```ts
const databaseProvider: ComponentSpec = {
  name: "database-provider",
  async apply(ctx) {
    const pool = await openPool(process.env.DATABASE_URL!);
    ctx.effect(() => () => pool.end());
    ctx.provide(database, {
      subscribe: (onRow) => subscribeToRows(pool, onRow),
    });
  },
};
```

That composition stops at a process or trust boundary. A browser component projects to an MCP-UI
`ui://` resource; it does not receive the server context, service keys, database credentials, pool
or agent handle. Its sandboxed iframe emits declarative UI actions. A trusted host authenticates and
authorizes them, validates inputs, and brokers them to typed MCP tools/resources or A2A conversation
actions. Protocol data crosses back, not backend objects.

```text
browser component → trusted host → typed MCP tool/resource → server component → database
                                  └→ A2A conversation action → agent
```

A2A and MCP are wire projections of capabilities owned by the local runtime. They neither create nor
own local component fibers; their registrations should instead be reversible effects of the server
component that owns the underlying resource.

### Proposed capability contract

The full-stack direction is for browser components to declare named capabilities and for a
server-side component to register narrow MCP tools/resources during `apply`, then unregister them
and close long-lived resources during teardown.

This registry and browser declaration are **proposed application contracts, not current
`@umwelten/substrate` APIs**. The package currently exports lifecycle and service primitives, not
`declareCapability`, an MCP registry, or automatic browser-to-service bindings. An application-owned
contract could eventually look like this:

```ts
// Browser-safe manifest: names only, never credentials or handles.
const invoicePanel = {
  capabilities: ["invoices.list", "conversation.ask"],
};

// Trusted server process: illustrative app-owned registry.
const mcpRegistry = serviceKey<AppMcpRegistry>("app:mcp-registry");

const invoiceBackend: ComponentSpec = {
  inject: [mcpRegistry],
  async apply(ctx, view) {
    const pool = await openPool(process.env.DATABASE_URL!);
    ctx.effect(() => () => pool.end());
    ctx.effect(() => view.get(mcpRegistry).registerTool({
      name: "invoices.list",
      input: ListInvoicesSchema,
      run: (input) => listInvoices(pool, input),
    }));
  },
};
```

Each resource has its own inverse registered immediately after acquisition.
If tool registration throws, the activation still closes the pool. If tool
unregistration rejects during teardown, context cleanup still attempts the pool
inverse; combining both into one callback would skip it after the first rejection.

The trusted host resolves `invoices.list` to that MCP tool and `conversation.ask` to an A2A action
only after authorization. The browser knows neither implementation.

## 6. Reference implementation sources

The API and lifecycle details in this guide were checked against public `main` in
The-Focus-AI/umwelten:

- [`component.ts`](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/component.ts)
  and its [tests](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/component.test.ts)
- [`context.ts`](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/context.ts),
  [`services.ts`](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/services.ts),
  and the [isolation tests](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/isolation.test.ts)
- [`loader.ts`](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/loader.ts), its
  [tests](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/src/loader.test.ts),
  and the [HMR example](https://github.com/The-Focus-AI/umwelten/blob/main/packages/substrate/examples/hmr.ts)
- [ADR 0032](https://github.com/The-Focus-AI/umwelten/blob/main/docs/adr/0032-components-project-onto-the-wire-as-ui-resources.md)
  for the accepted but not yet implemented wire-projection direction

For the MCP route and A2A backend pattern that carries those projections, see
[`GDE-001`](./GDE-001-a2a-agent.md).
