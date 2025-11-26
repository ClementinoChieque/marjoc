import { useState, useEffect, useMemo } from "react";
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
import marjocLogo from "@/assets/marjoc-logo.jpg";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#14b8a6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444"];

const Relatorios = () => {
  const [periodo, setPeriodo] = useState<"semanal" | "mensal">("semanal");
  const [vendas, setVendas] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: vendasData, error: vendasError } = await supabase
        .from("vendas")
        .select("*")
        .order("data", { ascending: false });

      if (vendasError) throw vendasError;

      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("*");

      if (produtosError) throw produtosError;

      setVendas(vendasData || []);
      setProdutos(produtosData || []);
    } catch (error: any) {
      toast.error("Erro ao carregar dados: " + error.message);
    }
  };

  const vendasFiltradas = useMemo(() => {
    const agora = new Date();
    const limite = new Date();

    if (periodo === "semanal") {
      limite.setDate(agora.getDate() - 7);
    } else {
      limite.setMonth(agora.getMonth() - 1);
    }

    return vendas.filter((venda) => new Date(venda.data) >= limite);
  }, [vendas, periodo]);

  const totalVendas = vendasFiltradas.reduce(
    (acc, venda) => acc + venda.total,
    0
  );
  const quantidadeVendas = vendasFiltradas.reduce(
    (acc, venda) => acc + venda.quantidade,
    0
  );

  const produtosAgrupados = useMemo(() => {
    const grupos: { [key: string]: { quantidade: number; total: number } } = {};

    vendasFiltradas.forEach((venda) => {
      if (!grupos[venda.produto_nome]) {
        grupos[venda.produto_nome] = { quantidade: 0, total: 0 };
      }
      grupos[venda.produto_nome].quantidade += venda.quantidade;
      grupos[venda.produto_nome].total += venda.total;
    });

    return Object.entries(grupos).map(([nome, dados]) => ({
      nome,
      quantidade: dados.quantidade,
      total: dados.total,
    }));
  }, [vendasFiltradas]);

  const dadosGraficoLinha = useMemo(() => {
    const dados: { [key: string]: number } = {};

    vendasFiltradas.forEach((venda) => {
      const data = new Date(venda.data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
      dados[data] = (dados[data] || 0) + venda.total;
    });

    return Object.entries(dados)
      .map(([data, valor]) => ({ data, valor }))
      .slice(-7);
  }, [vendasFiltradas]);

  const dadosGraficoPizza = useMemo(() => {
    return produtosAgrupados.slice(0, 5).map((produto) => ({
      name: produto.nome,
      value: produto.total,
    }));
  }, [produtosAgrupados]);

  const handleExportar = (formato: "pdf" | "csv") => {
    const dadosVendas = vendasFiltradas.map((venda) => ({
      id: venda.id,
      produtoId: venda.produto_id,
      produtoNome: venda.produto_nome,
      quantidade: venda.quantidade,
      precoVenda: venda.preco_unitario,
      total: venda.total,
      data: venda.data,
    }));

    const dadosProdutos = produtos.map((produto) => ({
      id: produto.id,
      nome: produto.nome,
      estoque: produto.estoque,
    }));

    if (formato === "pdf") {
      exportToPDF(
        dadosVendas,
        dadosProdutos,
        periodo,
        quantidadeVendas,
        totalVendas,
        marjocLogo
      );
      toast.success("Relatório PDF exportado com sucesso!");
    } else {
      exportToCSV(
        dadosVendas,
        dadosProdutos,
        periodo,
        quantidadeVendas,
        totalVendas
      );
      toast.success("Relatório CSV exportado com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios</h2>
          <p className="text-sm text-muted-foreground">
            Análise de vendas e estoque
          </p>
        </div>

        <div className="flex gap-3">
          <Select
            value={periodo}
            onValueChange={(value: "semanal" | "mensal") => setPeriodo(value)}
          >
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
              <DropdownMenuItem onClick={() => handleExportar("pdf")}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportar("csv")}>
                <FileText className="mr-2 h-4 w-4" />
                Exportar como CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Total de Vendas
              </p>
              <p className="text-3xl font-bold text-foreground">
                Akz {totalVendas.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Período: {periodo === "semanal" ? "Últimos 7 dias" : "Último mês"}
              </p>
            </div>
            <div className="rounded-full bg-secondary p-3 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Produtos Vendidos
              </p>
              <p className="text-3xl font-bold text-foreground">
                {quantidadeVendas}
              </p>
              <p className="text-xs text-muted-foreground">
                Unidades no período
              </p>
            </div>
            <div className="rounded-full bg-secondary p-3 text-primary">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {vendasFiltradas.length > 0 && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Vendas ao Longo do Tempo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosGraficoLinha}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => `Akz ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    name="Valor (Akz)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Top 5 Produtos Vendidos
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosGraficoPizza.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `Akz ${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Produtos Mais Vendidos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={produtosAgrupados.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toString()}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#14b8a6" name="Quantidade" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Detalhes das Vendas
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Nenhuma venda registrada no período
                  </TableCell>
                </TableRow>
              ) : (
                vendasFiltradas.map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell>
                      {new Date(venda.data).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {venda.produto_nome}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{venda.quantidade}</Badge>
                    </TableCell>
                    <TableCell>Akz {venda.preco_unitario.toFixed(2)}</TableCell>
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

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Estoque Atual
        </h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor Unitário</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground"
                  >
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{produto.categoria}</Badge>
                    </TableCell>
                    <TableCell>{produto.estoque}</TableCell>
                    <TableCell>Akz {produto.preco_venda.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      Akz {(produto.preco_venda * produto.estoque).toFixed(2)}
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
