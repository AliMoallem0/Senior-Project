import { useState, useMemo } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { countries, Country } from '@/data/countries';

interface CountrySelectorProps {
  value: Country | null;
  onChange: (value: Country | null) => void;
  className?: string;
  showPhoneCode?: boolean;
}

export function CountrySelector({ value, onChange, className, showPhoneCode = false }: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Remove duplicate countries by code
  const uniqueCountries = useMemo(() => {
    const seen = new Set();
    return countries.filter(country => {
      const duplicate = seen.has(country.code);
      seen.add(country.code);
      return !duplicate;
    });
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return uniqueCountries;
    
    const search = searchQuery.toLowerCase().trim();
    const searchTerms = search.split(/\s+/);
    
    return uniqueCountries.filter(country => 
      searchTerms.every(term => 
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term) ||
        country.phoneCode.toLowerCase().replace(/[+\s-]/g, '').includes(term.replace(/[+\s-]/g, '')) ||
        // Add common country name variations
        (country.name === 'United States' && (term === 'usa' || term === 'us' || term === 'america')) ||
        (country.name === 'United Kingdom' && (term === 'uk' || term === 'britain' || term === 'gb')) ||
        (country.name === 'United Arab Emirates' && (term === 'uae' || term === 'emirates'))
      )
    );
  }, [uniqueCountries, searchQuery]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
        >
          {value ? (
            <>
              <span className="flex items-center gap-2">
                <img 
                  src={value.flag} 
                  alt={`${value.name} flag`}
                  className="w-5 h-4 object-cover rounded-sm"
                />
                {showPhoneCode ? value.phoneCode : value.name}
              </span>
            </>
          ) : (
            "Select country..."
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search country..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {filteredCountries.map((country) => (
              <CommandItem
                key={country.code}
                value={country.code}
                onSelect={() => {
                  onChange(country);
                  setOpen(false);
                  setSearchQuery('');
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value?.code === country.code ? "opacity-100" : "opacity-0"
                  )}
                />
                <img 
                  src={country.flag} 
                  alt={`${country.name} flag`}
                  className="w-5 h-4 object-cover rounded-sm mr-2"
                />
                <span>{showPhoneCode ? country.phoneCode : country.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 