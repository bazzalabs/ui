/**
 * Re-export LoaderAdapterContext from @bazza-ui/menu for backwards compatibility.
 * The context is now part of the menu primitive package and can be used by all menu implementations.
 *
 * @deprecated Import from '@bazza-ui/menu' instead of '@bazza-ui/command-menu/contexts/loader-adapter-context'
 */
export {
  LoaderAdapterProvider,
  useLoaderAdapter,
} from '@bazza-ui/menu'
