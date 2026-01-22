import { useState, useRef, useEffect } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import dayjs, { Dayjs } from 'dayjs'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

// Custom MUI theme to match the app's teal color
const theme = createTheme({
  palette: {
    primary: {
      main: '#009688', // teal-primary
    },
  },
  components: {
    MuiPickersDay: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          '&.Mui-selected': {
            backgroundColor: '#009688',
            '&:hover': {
              backgroundColor: '#00796b',
            },
          },
          '&.MuiPickersDay-today': {
            borderColor: '#009688',
          },
        },
      },
    },
    MuiPickersCalendarHeader: {
      styleOverrides: {
        label: {
          fontSize: '1rem',
          fontWeight: 600,
        },
      },
    },
  } as any, // Type assertion for MUI components
})

interface MuiDatePickerProps {
  value: Date | undefined
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
}

export function MuiDatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  disabled,
  minDate,
  maxDate,
}: MuiDatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDateChange = (newValue: Dayjs | null) => {
    if (newValue) {
      onChange(newValue.toDate())
      setOpen(false)
    }
  }

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-0 border-0 border-b border-[#d0d5dd] h-11 text-left font-normal hover:bg-transparent disabled:opacity-50 bg-transparent"
      >
        <span className={value ? "text-[#101928]" : "text-[#727a86]"}>
          {value ? format(value, "dd/MM/yyyy") : placeholder}
        </span>
        <CalendarIcon className="h-5 w-5 text-[#667185]" />
      </button>
      
      {open && (
        <div 
          className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-100 overflow-hidden"
          style={{ 
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
        >
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={value ? dayjs(value) : null}
                onChange={handleDateChange}
                minDate={minDate ? dayjs(minDate) : undefined}
                maxDate={maxDate ? dayjs(maxDate) : undefined}
                disabled={disabled}
                sx={{
                  '& .MuiDayCalendar-monthContainer': {
                    marginBottom: '-8px',
                  },
                  '& .MuiPickersCalendarHeader-root': {
                    paddingBottom: '4px',
                  },
                }}
              />
            </LocalizationProvider>
          </ThemeProvider>
        </div>
      )}
    </div>
  )
}

export default MuiDatePicker
