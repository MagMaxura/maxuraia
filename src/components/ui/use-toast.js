import { useState, useEffect } from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

let count = 0

function generateId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

const toastTimeouts = new Map()

let handlers = new Set()

const toast = ({ ...props }) => {
  handlers.forEach((handler) => handler(props))
  return {
    id: generateId(),
    dismiss: () => {},
    update: () => {}
  }
}

export function useToast() {
  const [state, setState] = useState({
    toasts: [],
  })

  useEffect(() => {
    handlers.add(addToast)
    return () => {
      handlers.delete(addToast)
    }
  }, [])

  const addToast = useCallback(({ ...props }) => {
    const id = generateId()

    const update = (props) =>
      setState((state) => ({
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, ...props } : t
        ),
      }))

    const dismiss = () => setState((state) => ({
      ...state,
      toasts: state.toasts.filter((t) => t.id !== id),
    }))

    setState((state) => ({
      ...state,
      toasts: [
        { ...props, id, dismiss },
        ...state.toasts,
      ].slice(0, TOAST_LIMIT),
    }))

    // Auto-dismiss after delay
    const timeout = setTimeout(() => {
      dismiss()
    }, props.duration || TOAST_REMOVE_DELAY)

    toastTimeouts.set(id, timeout)

    return {
      id,
      dismiss,
      update,
    }
  }, [setState]); // setState es una referencia estable proporcionada por useState

  useEffect(() => {
    const timeouts = Array.from(toastTimeouts.values())
    
    return () => {
      timeouts.forEach(clearTimeout)
      toastTimeouts.clear()
    }
  }, [state.toasts])

  return {
    toast: addToast,
    toasts: state.toasts,
  }
}

export { toast }
