# Angular parity translation

The Angular models package is declaration-only apart from constants and
serialization helpers. Vanilla preserves every public interface and type as a
TypeScript export; it does not create runtime constructor shims for erased
types. Runtime constants and helpers retain their Angular public names.

The root entry point explicitly forwards model types so API inventory tooling
can audit the package boundary while consumers may continue importing from the
package root.
