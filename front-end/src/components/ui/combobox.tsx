"use client"

// @dthu/ui 0.2.0 · combobox (Radix UI Popover + cmdk)
import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

export interface ComboboxOption {
  value: string
  label: string
}

/* =========================================================================
 * 1. Official dthu-kit Combobox (Single-component format)
 * ========================================================================= */
export interface StandardComboboxProps {
  options: ComboboxOption[]
  value?: string
  onChange?: (v: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  id?: string
  "aria-label"?: string
  "aria-invalid"?: boolean
}

/* =========================================================================
 * 2. Compound Combobox (Radix UI Popover + cmdk)
 * ========================================================================= */
interface ComboboxContextType<T = any> {
  open: boolean
  setOpen: (open: boolean) => void
  items?: readonly T[]
  value?: T | null
  onValueChange?: (val: T | null) => void
  itemToStringValue?: (item: T) => string
  itemToStringLabel?: (item: T) => string
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const ComboboxContext = React.createContext<ComboboxContextType | null>(null)

function useComboboxContext<T>() {
  const ctx = React.useContext(ComboboxContext) as ComboboxContextType<T> | null
  return ctx
}

export interface CompoundComboboxProps<T = any> {
  items?: readonly T[]
  value?: T | null
  onValueChange?: (val: T | null) => void
  itemToStringValue?: (item: T) => string
  itemToStringLabel?: (item: T) => string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

/**
 * Combobox chuẩn dthu-kit hỗ trợ cả 2 cách dùng:
 * 1. Single component: `<Combobox options={...} value={...} onChange={...} />`
 * 2. Compound: `<Combobox items={...} value={...}><ComboboxInput /><ComboboxContent>...</ComboboxContent></Combobox>`
 */
function Combobox<T = any>(
  props: (StandardComboboxProps & { items?: never }) | CompoundComboboxProps<T>
) {
  // Nếu là format 1: Single component dthu-kit chuẩn
  if ("options" in props && props.options) {
    const {
      options,
      value,
      onChange,
      placeholder,
      searchPlaceholder,
      emptyText,
      className,
      disabled,
      loading,
      id,
      "aria-label": ariaLabel,
      "aria-invalid": ariaInvalid,
    } = props as StandardComboboxProps

    const { labels } = useUiConfig()
    const [open, setOpen] = React.useState(false)
    const current = options.find((o) => o.value === value)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            role="combobox"
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={ariaInvalid}
            aria-busy={loading || undefined}
            aria-expanded={open}
            data-state={open ? "open" : "closed"}
            className={cn(
              "group/sel flex h-9 w-full coarse:h-11 coarse:text-base cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background pr-1.5 pl-[11px] text-left text-body leading-[22px] text-foreground transition-[border-color,box-shadow] duration-[120ms] outline-none hover:border-muted-foreground focus-visible:border-primary focus-visible:shadow-focus-field data-[state=open]:border-primary data-[state=open]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)] disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle-foreground",
              !current && "text-subtle-foreground",
              className
            )}
          >
            <span className="min-w-0 flex-1 truncate">
              {current?.label ?? placeholder ?? labels.select}
            </span>
            <ChevronDown className="size-4 shrink-0 text-subtle-foreground transition-transform duration-150 group-data-[state=open]/sel:rotate-180 group-data-[state=open]/sel:text-primary" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-56 p-0 z-[9999]"
        >
          <Command>
            <CommandInput placeholder={searchPlaceholder ?? labels.search} />
            <CommandList>
              <CommandEmpty>
                {loading ? labels.loading : emptyText ?? labels.noResults}
              </CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    data-checked={o.value === value}
                    onSelect={() => {
                      onChange?.(o.value)
                      setOpen(false)
                    }}
                  >
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  // Format 2: Compound component (Radix Popover)
  const compoundProps = props as CompoundComboboxProps<T>
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  const open = compoundProps.open !== undefined ? compoundProps.open : internalOpen
  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (compoundProps.onOpenChange) {
        compoundProps.onOpenChange(nextOpen)
      } else {
        setInternalOpen(nextOpen)
      }
      if (!nextOpen) {
        setSearchQuery("")
      }
    },
    [compoundProps]
  )

  const ctxValue = React.useMemo<ComboboxContextType<T>>(
    () => ({
      open,
      setOpen,
      items: compoundProps.items,
      value: compoundProps.value,
      onValueChange: compoundProps.onValueChange,
      itemToStringValue: compoundProps.itemToStringValue,
      itemToStringLabel: compoundProps.itemToStringLabel,
      searchQuery,
      setSearchQuery,
    }),
    [
      open,
      setOpen,
      compoundProps.items,
      compoundProps.value,
      compoundProps.onValueChange,
      compoundProps.itemToStringValue,
      compoundProps.itemToStringLabel,
      searchQuery,
    ]
  )

  return (
    <ComboboxContext.Provider value={ctxValue}>
      <Popover open={open} onOpenChange={setOpen}>
        {compoundProps.children}
      </Popover>
    </ComboboxContext.Provider>
  )
}

/* =========================================================================
 * ComboboxInput (Trigger)
 * ========================================================================= */
interface ComboboxInputProps extends React.ComponentProps<"button"> {
  placeholder?: string
  showClear?: boolean
  showTrigger?: boolean
}

const ComboboxInput = React.forwardRef<HTMLButtonElement, ComboboxInputProps>(
  (
    {
      className,
      placeholder = "Chọn...",
      showClear = false,
      showTrigger = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const ctx = useComboboxContext()
    const currentLabel = React.useMemo(() => {
      if (!ctx?.value) return ""
      if (ctx.itemToStringLabel) {
        return ctx.itemToStringLabel(ctx.value)
      }
      if (typeof ctx.value === "object" && ctx.value !== null && "name" in ctx.value) {
        return (ctx.value as any).name
      }
      if (typeof ctx.value === "object" && ctx.value !== null && "label" in ctx.value) {
        return (ctx.value as any).label
      }
      return String(ctx.value)
    }, [ctx?.value, ctx?.itemToStringLabel])

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      ctx?.onValueChange?.(null)
    }

    return (
      <PopoverTrigger asChild>
        <button
          ref={ref}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-expanded={ctx?.open}
          data-state={ctx?.open ? "open" : "closed"}
          className={cn(
            "group/combobox-trigger flex h-9 w-full coarse:h-11 coarse:text-base cursor-pointer items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-left text-control text-foreground shadow-none transition-[color,background-color,border-color,box-shadow] duration-[120ms] outline-none hover:border-muted-foreground focus-visible:border-primary focus-visible:shadow-focus-field disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle-foreground",
            !currentLabel && "text-subtle-foreground",
            className
          )}
          {...props}
        >
          <span className="min-w-0 flex-1 truncate">
            {currentLabel || placeholder}
          </span>
          <div className="flex items-center gap-1 ml-1.5 shrink-0">
            {showClear && currentLabel && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Xoá lựa chọn"
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClear(e as any)
                }}
                className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground opacity-60 hover:opacity-100 hover:bg-muted transition-colors"
              >
                <X className="size-3.5" />
              </span>
            )}
            {showTrigger && (
              <ChevronDown className="size-4 text-muted-foreground transition-transform duration-150 group-data-[state=open]/combobox-trigger:rotate-180" />
            )}
          </div>
        </button>
      </PopoverTrigger>
    )
  }
)
ComboboxInput.displayName = "ComboboxInput"

/* =========================================================================
 * ComboboxContent (Popover Content)
 * ========================================================================= */
const ComboboxContent = React.forwardRef<
  React.ComponentRef<typeof PopoverContent>,
  React.ComponentPropsWithoutRef<typeof PopoverContent>
>(({ className, children, align = "start", sideOffset = 4, ...props }, ref) => {
  const ctx = useComboboxContext()
  const { labels } = useUiConfig()

  return (
    <PopoverContent
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-[9999] w-[var(--radix-popover-trigger-width)] min-w-[220px] max-w-[var(--radix-popover-content-available-width,400px)] p-0 shadow-lg border border-border bg-popover text-popover-foreground rounded-lg overflow-hidden outline-none pointer-events-auto",
        className
      )}
      {...props}
    >
      <Command shouldFilter={false} className="w-full">
        <CommandInput
          placeholder={labels.search || "Tìm kiếm..."}
          value={ctx?.searchQuery || ""}
          onValueChange={(q) => ctx?.setSearchQuery(q)}
          autoFocus
        />
        {children}
      </Command>
    </PopoverContent>
  )
})
ComboboxContent.displayName = "ComboboxContent"

/* =========================================================================
 * ComboboxList (Command List)
 * ========================================================================= */
interface ComboboxListProps extends Omit<React.ComponentPropsWithoutRef<typeof CommandList>, "children"> {
  children?: React.ReactNode | ((item: any) => React.ReactNode)
}

const ComboboxList = React.forwardRef<
  React.ComponentRef<typeof CommandList>,
  ComboboxListProps
>(({ className, children, ...props }, ref) => {
  const ctx = useComboboxContext()

  // Lọc items theo searchQuery nếu có
  const filteredItems = React.useMemo(() => {
    if (!ctx?.items) return []
    const q = ctx.searchQuery.trim().toLowerCase()
    if (!q) return ctx.items
    return ctx.items.filter((item) => {
      const label = ctx.itemToStringLabel
        ? ctx.itemToStringLabel(item)
        : typeof item === "object" && item !== null && "name" in item
        ? (item as any).name
        : typeof item === "object" && item !== null && "label" in item
        ? (item as any).label
        : String(item)
      return String(label).toLowerCase().includes(q)
    })
  }, [ctx?.items, ctx?.searchQuery, ctx?.itemToStringLabel])

  return (
    <CommandList
      ref={ref}
      className={cn("max-h-60 overflow-y-auto overscroll-contain p-1 no-scrollbar", className)}
      {...props}
    >
      <CommandGroup>
        {typeof children === "function"
          ? filteredItems.map((item: any, idx: number) => {
              const element = children(item)
              return React.isValidElement(element)
                ? React.cloneElement(element as any, { key: (element as any).key ?? idx })
                : element
            })
          : children}
      </CommandGroup>
    </CommandList>
  )
})
ComboboxList.displayName = "ComboboxList"

/* =========================================================================
 * ComboboxItem (Command Item)
 * ========================================================================= */
interface ComboboxItemProps extends Omit<React.ComponentPropsWithoutRef<typeof CommandItem>, "value"> {
  value: any
}

const ComboboxItem = React.forwardRef<
  React.ComponentRef<typeof CommandItem>,
  ComboboxItemProps
>(({ className, children, value: itemValue, onSelect, ...props }, ref) => {
  const ctx = useComboboxContext()

  const isSelected = React.useMemo(() => {
    if (!ctx?.value) return false
    if (ctx.itemToStringValue) {
      return ctx.itemToStringValue(ctx.value) === ctx.itemToStringValue(itemValue)
    }
    if (typeof itemValue === "object" && itemValue !== null && "id" in itemValue && typeof ctx.value === "object" && ctx.value !== null && "id" in ctx.value) {
      return (itemValue as any).id === (ctx.value as any).id
    }
    if (typeof itemValue === "object" && itemValue !== null && "value" in itemValue && typeof ctx.value === "object" && ctx.value !== null && "value" in ctx.value) {
      return (itemValue as any).value === (ctx.value as any).value
    }
    return ctx.value === itemValue
  }, [ctx?.value, itemValue, ctx?.itemToStringValue])

  const labelString = React.useMemo(() => {
    if (typeof children === "string") return children
    if (ctx?.itemToStringLabel) return ctx.itemToStringLabel(itemValue)
    if (typeof itemValue === "object" && itemValue !== null && "name" in itemValue) {
      return (itemValue as any).name
    }
    if (typeof itemValue === "object" && itemValue !== null && "label" in itemValue) {
      return (itemValue as any).label
    }
    return String(itemValue)
  }, [children, ctx?.itemToStringLabel, itemValue])

  return (
    <CommandItem
      ref={ref}
      value={labelString}
      data-checked={isSelected}
      onSelect={() => {
        ctx?.onValueChange?.(itemValue)
        ctx?.setOpen(false)
        onSelect?.(labelString)
      }}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-control text-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground data-[selected=true]:bg-secondary data-[selected=true]:text-foreground data-[checked=true]:bg-accent data-[checked=true]:font-semibold data-[checked=true]:text-primary data-[checked=true]:data-[selected=true]:bg-[color-mix(in_srgb,var(--primary)_22%,var(--background))] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {isSelected && <Check className="size-4 shrink-0 text-primary pointer-events-none" />}
    </CommandItem>
  )
})
ComboboxItem.displayName = "ComboboxItem"

/* =========================================================================
 * ComboboxEmpty
 * ========================================================================= */
const ComboboxEmpty = React.forwardRef<
  React.ComponentRef<typeof CommandEmpty>,
  React.ComponentPropsWithoutRef<typeof CommandEmpty>
>(({ className, children = "Không có kết quả.", ...props }, ref) => {
  const ctx = useComboboxContext()
  const isEmpty = !ctx?.items || ctx.items.length === 0 || (ctx.searchQuery && ctx.items.length > 0)
  if (!isEmpty) return null

  return (
    <CommandEmpty
      ref={ref}
      className={cn("p-4 text-center text-sm text-subtle-foreground", className)}
      {...props}
    >
      {children}
    </CommandEmpty>
  )
})
ComboboxEmpty.displayName = "ComboboxEmpty"

/* =========================================================================
 * Additional Helpers & Subcomponents
 * ========================================================================= */
const ComboboxGroup = CommandGroup
const ComboboxSeparator = CommandSeparator

function ComboboxTrigger({ children, className, ...props }: React.ComponentProps<"button">) {
  return (
    <PopoverTrigger asChild>
      <button type="button" className={cn("cursor-pointer", className)} {...props}>
        {children}
        <ChevronDown className="size-4 text-muted-foreground" />
      </button>
    </PopoverTrigger>
  )
}

function ComboboxValue({ ...props }: React.ComponentProps<"span">) {
  return <span {...props} />
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxTrigger,
  ComboboxValue,
}
