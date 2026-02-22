import * as React from "react"

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={`text-sm font-medium text-gray-700 block mb-1 ${className || ''}`}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
```

6. Commit: "Add: label component"

---

## ✅ **RISULTATO:**
```
components/
└── ui/
    ├── button.tsx ✅
    ├── card.tsx ✅
    ├── input.tsx ✅
    ├── toast.tsx ✅
    └── label.tsx ← NUOVO!
