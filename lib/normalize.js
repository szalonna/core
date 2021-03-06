import defaultOptions from './defaults'
import { omit, clone, merge, mergeWith, mapObjIndexed } from 'nanoutils'

const normalize = (callbacks, obj) =>
  Object.keys(obj).reduce(
    (res, key) => {
      res[key] = callbacks[key] ? callbacks[key](obj[key], res, obj) : obj[key]
      return res
    },
    { _isNormalized: true }
  )

const defaults = mergeWith((a, b) => (b === undefined ? a : b))

const normalizers = {
  // Return adapter or null
  adapter: adapter => adapter || null,

  // Convert payload with
  payload(payload, res, prev) {
    if (process.env.NODE_ENV !== 'production') {
      if (payload) {
        if (payload.meta || payload.hooks || payload.payload) {
          console.warn(
            '[Apicase] Using reserved properties names (adapter, meta, hooks, payload) in payload is not recommended'
          )
        }
      }
    }
    return !payload ? {} : payload
  },

  hooks: hooks => {
    if (!hooks) return {}
    return mapObjIndexed((hooks, k) => {
      const hooksArr = Array.isArray(hooks) ? hooks : [hooks]
      if (process.env.NODE_ENV !== 'production') {
        hooksArr.forEach((hook, idx) => {
          if (typeof hook !== 'function') {
            throw new TypeError(
              '[Apicase] ' + k + ' hook #' + idx + ' is not a function'
            )
          }
        })
      }
      return hooksArr
    }, merge(clone(defaultOptions.hooks), hooks))
  }
}

const format = opts => ({
  adapter: opts.adapter,
  meta: opts.meta,
  hooks: opts.hooks,
  options: opts.options,
  payload: omit(['adapter', 'meta', 'hooks'], opts)
})

export const normalizeOptions = opts =>
  !opts
    ? { _isNormalized: true }
    : opts._isNormalized
      ? opts
      : normalize(
        normalizers,
        defaults(clone(defaultOptions), format(opts || {}))
      )
