import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast.tsx"

/**
 * Maximum number of toasts that can be displayed at a time.
 * @constant
 * @type {number}
 */
const TOAST_LIMIT = 1
/**
 * Delay in milliseconds before a toast is automatically removed from the DOM after being dismissed.
 * @constant
 * @type {number}
 */
const TOAST_REMOVE_DELAY = 1000000

/**
 * Represents the structure of a toast object used internally by the toaster system.
 * Extends `ToastProps` with an `id` and optional `title`, `description`, and `action` elements.
 * @typedef {ToastProps & { id: string; title?: React.ReactNode; description?: React.ReactNode; action?: ToastActionElement }}
 */
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

/**
 * Defines the possible action types for the toast reducer.
 * @constant
 * @type {object}
 * @property {string} ADD_TOAST - Action type for adding a new toast.
 * @property {string} UPDATE_TOAST - Action type for updating an existing toast.
 * @property {string} DISMISS_TOAST - Action type for dismissing a toast (making it not visible).
 * @property {string} REMOVE_TOAST - Action type for removing a toast from the DOM.
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

/**
 * Generates a unique string ID for a new toast.
 * Increments a counter and returns its string representation.
 * @returns {string} A unique ID.
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

/**
 * Represents the type of actions that can be dispatched to the toast reducer.
 * Union of specific action object types.
 * @typedef {typeof actionTypes} ActionType
 */
type ActionType = typeof actionTypes

/**
 * Represents the different actions that can be dispatched to manage toast state.
 * @typedef {object} Action
 * @property {ActionType["ADD_TOAST"]} type - The type of action for adding a toast.
 * @property {ToasterToast} toast - The toast object to add.
 * @property {ActionType["UPDATE_TOAST"]} type - The type of action for updating a toast.
 * @property {Partial<ToasterToast>} toast - The partial toast object with updates.
 * @property {ActionType["DISMISS_TOAST"]} type - The type of action for dismissing a toast.
 * @property {ToasterToast["id"]} [toastId] - The ID of the toast to dismiss. If undefined, all toasts are dismissed.
 * @property {ActionType["REMOVE_TOAST"]} type - The type of action for removing a toast.
 * @property {ToasterToast["id"]} [toastId] - The ID of the toast to remove. If undefined, all toasts are removed.
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * Represents the state of the toaster system.
 * @interface State
 * @property {ToasterToast[]} toasts - An array of currently active or queued toasts.
 */
interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Adds a toast to a queue for removal after a delay.
 * If a toast is already in the queue, this function does nothing.
 * This is used to automatically clean up dismissed toasts from the DOM.
 * @param {string} toastId - The ID of the toast to schedule for removal.
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer function for managing the toast state.
 * Handles adding, updating, dismissing, and removing toasts.
 * @param {State} state - The current state of the toasts.
 * @param {Action} action - The action to be performed.
 * @returns {State} The new state after applying the action.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // This part of the reducer has a side effect: it schedules toasts for removal.
      // This is done to manage the lifecycle of toasts (dismiss -> remove from DOM).
      // For a stricter separation of concerns, this could be extracted into a dedicated effect or thunk if using a state management library like Redux.
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

/**
 * Dispatches an action to the toast reducer and notifies all registered listeners.
 * Updates the central `memoryState` with the new state returned by the reducer.
 * @param {Action} action - The action to dispatch.
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Represents the properties of a toast that can be passed to the `toast()` function.
 * Omits the `id` property as it is generated internally.
 * @typedef {Omit<ToasterToast, "id">} Toast
 */
type Toast = Omit<ToasterToast, "id">

/**
 * Displays a toast notification.
 * Generates a unique ID for the toast, and dispatches an ADD_TOAST action.
 * Provides `update` and `dismiss` functions for the created toast.
 *
 * @param {Toast} props - The properties of the toast to display (title, description, variant, etc.).
 * @returns {{ id: string; dismiss: () => void; update: (props: ToasterToast) => void }} 
 *          An object containing the ID of the toast, a function to dismiss it, and a function to update it.
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Custom React hook for interacting with the toast system.
 * Provides the current toast state, a function to display new toasts (`toast`), 
 * and a function to dismiss toasts (`dismiss`).
 *
 * It subscribes to changes in the global toast state and updates its local state accordingly.
 *
 * @returns {{ toasts: ToasterToast[]; toast: (props: Toast) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void }; dismiss: (toastId?: string) => void }}
 *          An object containing the current toasts, the `toast` function, and the `dismiss` function.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
