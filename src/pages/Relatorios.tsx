import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Download, TrendingUp, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import logoUrl from "@/assets/marjoc-logo.png";

interface Venda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoVenda: number;
  total: number;
  data: string;
}

const Relatorios = () => {
  const [periodo, setPeriodo] = useState<"semanal" | "mensal">("mensal");

  // Dados de exemplo - em produção viriam do estado global ou backend
  const vendas: Venda[] = [
    {
      id: "1",
      produtoId: "1",
      produtoNome: "Dipirona 500mg",
      quantidade: 25,
      precoVenda: 12.90,
      total: 322.50,
      data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      produtoId: "2",
      produtoNome: "Ibuprofeno 600mg",
      quantidade: 10,
      precoVenda: 18.50,
      total: 185.00,
      data: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      produtoId: "3",
      produtoNome: "Vitamina C 1g",
      quantidade: 15,
      precoVenda: 32.90,
      total: 493.50,
      data: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const produtos = [
    { id: "1", nome: "Dipirona 500mg", estoque: 125 },
    { id: "2", nome: "Ibuprofeno 600mg", estoque: 15 },
    { id: "3", nome: "Vitamina C 1g", estoque: 65 },
  ];

  const filtrarPorPeriodo = (venda: Venda) => {
    const dataVenda = new Date(venda.data);
    const agora = new Date();
    const diferenca = agora.getTime() - dataVenda.getTime();
    const dias = diferenca / (1000 * 60 * 60 * 24);

    if (periodo === "semanal") {
      return dias <= 7;
    } else {
      return dias <= 30;
    }
  };

  const vendasFiltradas = vendas.filter(filtrarPorPeriodo);

  const resumo = useMemo(() => {
    const totalVendas = vendasFiltradas.reduce((acc, v) => acc + v.quantidade, 0);
    const totalReceita = vendasFiltradas.reduce((acc, v) => acc + v.total, 0);
    const produtosMaisVendidos = vendasFiltradas.reduce((acc, v) => {
      const existente = acc.find((p) => p.produtoId === v.produtoId);
      if (existente) {
        existente.quantidade += v.quantidade;
      } else {
        acc.push({
          produtoId: v.produtoId,
          produtoNome: v.produtoNome,
          quantidade: v.quantidade,
        });
      }
      return acc;
    }, [] as { produtoId: string; produtoNome: string; quantidade: number }[]);

    produtosMaisVendidos.sort((a, b) => b.quantidade - a.quantidade);

    return {
      totalVendas,
      totalReceita,
      produtosMaisVendidos: produtosMaisVendidos.slice(0, 5),
    };
  }, [vendasFiltradas]);

  const handleExportarPDF = async () => {
    try {
      await exportToPDF(
        vendasFiltradas,
        produtos,
        periodo,
        resumo.totalVendas,
        resumo.totalReceita,
        logoUrl
      );
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório PDF");
      console.error(error);
    }
  };

  const handleExportarCSV = () => {
    try {
      exportToCSV(
        vendasFiltradas,
        produtos,
        periodo,
        resumo.totalVendas,
        resumo.totalReceita
      );
      toast.success("Relatório CSV exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório CSV");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Visualize vendas e estoque por período
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(value: "semanal" | "mensal") => setPeriodo(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportarPDF}>
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarCSV}>
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Vendas</p>
              <p className="text-2xl font-bold">{resumo.totalVendas}</p>
              <p className="text-xs text-muted-foreground">unidades vendidas</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-success/10 p-3">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold">Akz {resumo.totalReceita.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">no período</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-warning/10 p-3">
              <Package className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produtos em Estoque</p>
              <p className="text-2xl font-bold">{produtos.reduce((acc, p) => acc + p.estoque, 0)}</p>
              <p className="text-xs text-muted-foreground">unidades totais</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Produtos Mais Vendidos</h3>
          <div className="space-y-3">
            {resumo.produtosMaisVendidos.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma venda registrada no período
              </p>
            ) : (
              resumo.produtosMaisVendidos.map((produto, index) => (
                <div key={produto.produtoId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{produto.produtoNome}</p>
                      <p className="text-sm text-muted-foreground">
                        {produto.quantidade} unidades vendidas
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Estoque Atual</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell className="text-right">{produto.estoque}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold">Histórico de Vendas</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Preço Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma venda registrada no período
                  </TableCell>
                </TableRow>
              ) : (
                vendasFiltradas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {new Date(venda.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">{venda.produtoNome}</TableCell>
                    <TableCell>{venda.quantidade}</TableCell>
                    <TableCell>Akz {venda.precoVenda.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      Akz {venda.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Relatorios;
