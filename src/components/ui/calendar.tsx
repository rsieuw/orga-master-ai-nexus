import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type CustomComponents, type ChevronProps } from "react-day-picker";

import { cn } from "@/lib/utils.ts";
import { buttonVariants } from "@/components/ui/button.tsx";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Aangepaste Chevron component
function CustomChevron(props: ChevronProps) {
  const className = "h-4 w-4 stroke-gray-400 group-hover:stroke-gray-500";
  switch (props.orientation) {
    case "left":
      return <ChevronLeft className={className} />;
    case "right":
      return <ChevronRight className={className} />;
    default:
      // Fallback: geef een leeg fragment terug om linterfout te voorkomen
      return <></>;
  }
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-start pt-1 relative items-center pr-20",
        caption_label: "text-sm font-medium",
        nav: "absolute top-3 right-3 flex items-center space-x-1",
        nav_button: "",
        button_previous: cn(
          "group inline-flex items-center justify-center rounded-md border border-input text-muted-foreground",
          "h-7 w-7 bg-transparent p-0 hover:bg-accent hover:text-accent-foreground"
        ),
        button_next: cn(
          "group inline-flex items-center justify-center rounded-md border border-input text-muted-foreground",
          "h-7 w-7 bg-transparent p-0 hover:bg-accent hover:text-accent-foreground"
        ),
        table: "w-full border-collapse space-y-1",
        weekdays: "grid grid-cols-7",
        weekday: "text-muted-foreground rounded-md font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-30 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: CustomChevron,
      } satisfies Partial<CustomComponents>}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
