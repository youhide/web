import React from 'react'
import {
  ErrorOption,
  FieldPathValue,
  FormProvider as FormProviderNative,
  Path,
  SetValueConfig,
  useForm as useFormNative,
  UseFormClearErrors,
  useFormContext as useFormContextNative,
  UseFormGetValues,
  UseFormProps,
  UseFormRegister,
  UseFormSetError,
  UseFormSetFocus,
  UseFormSetValue,
  UseFormTrigger,
  UseFormUnregister,
  UseFormWatch
} from 'react-hook-form'

/* fixes circular type dependency in react-hook-form functions where it doesn't understand generics
   Type of property '[Symbol.species]' circularly references itself in mapped
   type '{ [K in keyof SharedArrayBuffer]-?: PathImpl<K & string, SharedArrayBuffer[K]>; }'.ts(2615)
 */
export function castSetValue<K extends Record<string, unknown>>(setValue: UseFormSetValue<K>) {
  return function <F extends keyof K>(name: F, value: K[F], options?: SetValueConfig) {
    ;(setValue as (name: F, value: K[F], options?: SetValueConfig) => void)(name, value, options)
  }
}

export function castClearErrors<K extends Record<string, unknown>>(
  clearErrors: UseFormClearErrors<K>
) {
  return function <F extends keyof K>(name: F) {
    ;(clearErrors as (name: F | F[]) => void)(name)
  }
}

export function castSetError<K extends Record<string, unknown>>(setError: UseFormSetError<K>) {
  return function <F extends keyof K>(name: F, error: ErrorOption) {
    ;(setError as (name: F | F[], error: ErrorOption) => void)(name, error)
  }
}

export function castWatch<K extends Record<string, unknown>>(watch: UseFormWatch<K>) {
  return watch as <F extends keyof K>(values?: F | F[]) => UseFormWatch<{ [k in F]: K[k] }>
}

export function castGetValues<K extends Record<string, unknown>>(getValues: UseFormGetValues<K>) {
  return function <F extends keyof K>(values?: F | F[]): { [k in F]: K[k] } {
    return (getValues as (values?: F | F[]) => { [k in F]: K[k] })(values)
  }
}

export function castTrigger<K extends Record<string, unknown>>(trigger: UseFormTrigger<K>) {
  return function <F extends keyof K>(name?: F | F[]) {
    return (trigger as (name?: F | F[]) => FieldPathValue<K, Path<K>>)(name)
  }
}

export function castSetFocus<K extends Record<string, unknown>>(setFocus: UseFormSetFocus<K>) {
  return function <F extends keyof K>(name: F) {
    return (setFocus as (name: F) => FieldPathValue<K, Path<K>>)(name)
  }
}

export function castRegister<K extends Record<string, unknown>>(register: UseFormRegister<K>) {
  return function <F extends keyof K>(name: F) {
    return (register as (name: F) => void)(name)
  }
}

export function castUnregister<K extends Record<string, unknown>>(
  unregister: UseFormUnregister<K>
) {
  return function <F extends keyof K>(name: F | F[]) {
    return (unregister as (name: F | F[]) => void)(name)
  }
}

export function useFormContext<K extends Record<string, unknown>>() {
  const {
    clearErrors: clearErrorsBroken,
    control: controlBroken,
    getValues: getValuesBroken,
    setError: setErrorBroken,
    setFocus: setFocusBroken,
    setValue: setValueBroken,
    register: registerBroken,
    trigger: triggerBroken,
    unregister: unregisterBroken,
    watch: watchBroken,
    ...unBroken
  } = useFormContextNative<K>()
  const clearErrors = castClearErrors<K>(clearErrorsBroken)
  const control = controlBroken as any
  const getValues = castGetValues<K>(getValuesBroken)
  const setError = castSetError<K>(setErrorBroken)
  const setFocus = castSetFocus<K>(setFocusBroken)
  const trigger = castTrigger<K>(triggerBroken)
  const setValue = castSetValue<K>(setValueBroken)
  const unregister = castUnregister<K>(unregisterBroken)
  const watch = castWatch<K>(watchBroken)

  const fixed = {
    clearErrors,
    control,
    getValues,
    setError,
    setFocus,
    setValue,
    trigger,
    unregister,
    watch
  }
  return {
    ...unBroken,
    ...fixed
  }
}

export function useForm<K extends Record<string, unknown>, C extends object = object>(
  props?: UseFormProps<K, C>
) {
  const {
    clearErrors: clearErrorsBroken,
    getValues: getValuesBroken,
    setError: setErrorBroken,
    setFocus: setFocusBroken,
    setValue: setValueBroken,
    register: registerBroken,
    trigger: triggerBroken,
    unregister: unregisterBroken,
    control: controlBroken,
    watch: watchBroken,
    ...unBroken
  } = useFormNative<K, C>(props)
  const clearErrors = castClearErrors<K>(clearErrorsBroken)
  const control = controlBroken as any
  const getValues = castGetValues<K>(getValuesBroken)
  const register = castRegister<K>(registerBroken)
  const setError = castSetError<K>(setErrorBroken)
  const setFocus = castSetFocus<K>(setFocusBroken)
  const setValue = castSetValue<K>(setValueBroken)
  const trigger = castTrigger<K>(triggerBroken)
  const unregister = castUnregister<K>(unregisterBroken)
  const watch = castWatch<K>(watchBroken)

  const fixed = {
    clearErrors,
    control,
    getValues,
    register,
    setError,
    setFocus,
    setValue,
    trigger,
    unregister,
    watch
  }
  return {
    ...unBroken,
    ...fixed
  }
}

export function FormProvider(
  props: { children: React.ReactNode } & ReturnType<typeof useFormNative>
): JSX.Element {
  const LoosyGoosyFormProvider = FormProviderNative as any
  return <LoosyGoosyFormProvider {...props}>{props.children}</LoosyGoosyFormProvider>
}
