import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { braBandRows, numericSizeRows } from "@/lib/sizes";

export function SizeGuide({ bra = false }: { bra?: boolean }) {
  const headers = bra ? ["RU/UA · DE/EU", "FR/ES", "IT", "UK/US"] : ["RU/UA", "FR/ES", "IT", "UK", "US", "INT", "DE/EU"];
  const rows = bra
    ? braBandRows.map((r) => [r.maker, r.es, r.it, r.ukUs])
    : numericSizeRows.map((r) => [r.maker, r.es, r.it, r.uk, r.us, r.intl, r.de]);
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="link" size="sm" className="h-auto p-0 normal-case tracking-normal">Guía de tallas</Button></DialogTrigger>
      <DialogContent className="max-w-2xl overflow-x-auto">
        <DialogHeader><DialogTitle className="font-display text-2xl">Guía de tallas</DialogTitle><DialogDescription>La talla principal de la tienda es FR/ES. La primera columna corresponde a la etiqueta del fabricante.</DialogDescription></DialogHeader>
        {bra && <p className="text-sm text-muted-foreground">La copa B, C o D es igual en todos los sistemas.</p>}
        <table className="w-full min-w-[32rem] border-collapse text-center text-sm">
          <thead><tr>{headers.map((h) => <th key={h} className="border-b px-2 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((v, i) => <td key={`${row[0]}-${i}`} className="border-b px-2 py-3">{v}</td>)}</tr>)}</tbody>
        </table>
      </DialogContent>
    </Dialog>
  );
}