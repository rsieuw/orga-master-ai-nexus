import * as React from "react";
import {
  FieldPath,
  FieldValues,
  useFormContext,
} from "react-hook-form";

// Type for Form Field Context
export type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

// Context for Form Fields
export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// Type for FormItem Context
export type FormItemContextValue = {
  id: string;
};

// Context for Form Items
export const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// Hook to access form field state and context
export const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext); // Use context defined in this file
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  // Ensure itemContext is available (it should be provided by FormItem)
  if (!itemContext) {
      throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}; 