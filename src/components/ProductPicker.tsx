import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatINR, type Product } from "@/lib/billing";

export function ProductPicker({
  products,
  value,
  onSelect,
}: {
  products: Product[];
  value: string;
  onSelect: (product: Product) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Search item…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,90vw)] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput placeholder="Type product name…" className="border-0" />
          </div>
          <CommandList>
            <CommandEmpty>No matching product.</CommandEmpty>
            {[...new Set(products.map((product) => product.category))].map((category) => (
              <CommandGroup key={category} heading={category}>
                {products
                  .filter((product) => product.category === category)
                  .map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${product.category}`}
                      onSelect={() => {
                        onSelect(product);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === product.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{product.name}</span>
                      <span className="ml-2 shrink-0 text-xs font-semibold text-brand">
                        {formatINR(product.price)}/{product.unit}
                      </span>
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}