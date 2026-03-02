'use client'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'

type QuoteItem = {
  description: string
  quantity: number
  unit_price: number
  total: number
}

type Quote = {
  quote_number: string
  quote_date: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  items: QuoteItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  status: string
}

type Business = {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
}

export function GeneratePDF({ quote, business }: { quote: Quote; business: Business }) {
  const generatePDF = async () => {
    // Dynamically import jsPDF to avoid SSR issues
    const { default: jsPDF } = await import('jspdf')
    
    const doc = new jsPDF()
    
    let y = 20
    
    // Header - Business Info
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(business.name, 20, y)
    y += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (business.address) {
      doc.text(business.address, 20, y)
      y += 5
    }
    if (business.city) {
      doc.text(business.city, 20, y)
      y += 5
    }
    if (business.phone) {
      doc.text(`Tel: ${business.phone}`, 20, y)
      y += 5
    }
    if (business.email) {
      doc.text(`Email: ${business.email}`, 20, y)
      y += 5
    }
    
    y += 10
    
    // Title
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('PREVENTIVO', 105, y, { align: 'center' })
    y += 15
    
    // Quote Info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`N. Preventivo: ${quote.quote_number}`, 20, y)
    doc.text(`Data: ${new Date(quote.quote_date).toLocaleDateString('it-IT')}`, 140, y)
    y += 10
    
    // Customer Info
    doc.setFont('helvetica', 'bold')
    doc.text('Cliente:', 20, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(quote.customer_name, 20, y)
    y += 5
    if (quote.customer_phone) {
      doc.text(`Tel: ${quote.customer_phone}`, 20, y)
      y += 5
    }
    if (quote.customer_email) {
      doc.text(`Email: ${quote.customer_email}`, 20, y)
      y += 5
    }
    
    y += 10
    
    // Table Header
    doc.setFillColor(59, 130, 246) // Blue
    doc.rect(20, y, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Descrizione', 22, y + 6)
    doc.text('Qtà', 120, y + 6)
    doc.text('Prezzo', 140, y + 6)
    doc.text('Totale', 170, y + 6)
    y += 10
    
    // Table Rows
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    
    quote.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? 245 : 255
      doc.setFillColor(bgColor, bgColor, bgColor)
      doc.rect(20, y - 2, 170, 8, 'F')
      
      // Wrap description if too long
      const maxWidth = 95
      const lines = doc.splitTextToSize(item.description, maxWidth)
      const lineHeight = 5
      
      lines.forEach((line: string, i: number) => {
        doc.text(line, 22, y + 6 + (i * lineHeight))
      })
      
      doc.text(item.quantity.toString(), 125, y + 6, { align: 'right' })
      doc.text(`€${item.unit_price.toFixed(2)}`, 160, y + 6, { align: 'right' })
      doc.text(`€${item.total.toFixed(2)}`, 185, y + 6, { align: 'right' })
      
      y += Math.max(8, lines.length * lineHeight + 2)
    })
    
    y += 5
    
    // Totals
    doc.setFont('helvetica', 'normal')
    doc.text('Subtotale:', 130, y)
    doc.text(`€${quote.subtotal.toFixed(2)}`, 185, y, { align: 'right' })
    y += 6
    
    if (quote.tax > 0) {
      doc.text(`IVA (${((quote.tax / quote.subtotal) * 100).toFixed(0)}%):`, 130, y)
      doc.text(`€${quote.tax.toFixed(2)}`, 185, y, { align: 'right' })
      y += 6
    }
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTALE:', 130, y)
    doc.text(`€${quote.total.toFixed(2)}`, 185, y, { align: 'right' })
    
    y += 15
    
    // Notes
    if (quote.notes) {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Note:', 20, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      const noteLines = doc.splitTextToSize(quote.notes, 170)
      noteLines.forEach((line: string) => {
        doc.text(line, 20, y)
        y += 5
      })
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.height
    doc.setFontSize(8)
    doc.setTextColor(128, 128, 128)
    doc.text('Preventivo generato da Lynqly', 105, pageHeight - 10, { align: 'center' })
    
    // Save PDF
    doc.save(`Preventivo_${quote.quote_number}.pdf`)
  }

  return (
    <Button onClick={generatePDF} variant="outline" size="sm">
      <FileDown className="w-4 h-4 mr-2" />
      Scarica PDF
    </Button>
  )
}
