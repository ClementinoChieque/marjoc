import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Package, TrendingUp, ShoppingCart } from "lucide-react";
import { exportToPDF, exportToCSV } from "@/lib/exportUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logoUrl from "@/assets/marjoc-logo.png";

interface Venda {
  id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
  data: string;
}

interface Produto {
  id: string;
  nome: string;
  estoque: number;
  preco_venda: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--success))', 'hsl(var(--warning))'];

const Relatorios = () => {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal'>('mensal');

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const [vendasResult, produtosResult] = await Promise.all([
      supabase.from('vendas').select('*').order('data', { ascending: false }),
      supabase.from('produtos').select('id, nome, estoque, preco_venda')
    ]);

    if (vendasResult.data) setVendas(vendasResult.data);
    if (produtosResult.data) setProdutos(produtosResult.data);
    
    setLoading(false);
  };

  const filtrarPorPeriodo = (vendas: Venda[]) => {
    const dataLimite = new Date();
    if (periodo === 'semanal') {
      dataLimite.setDate(dataLimite.getDate() - 7);
    } else {
      dataLimite.setDate(dataLimite.getDate() - 30);
    }
    
    return vendas.filter((v) => new Date(v.data) >= dataLimite);
  };

  const vendasFiltradas = filtrarPorPeriodo(vendas);

  const resumo = useMemo(() => {
    const totalVendas = vendasFiltradas.length;
    const receitaTotal = vendasFiltradas.reduce((sum, v) => sum + v.total, 0);
    const estoqueTotal = produtos.reduce((sum, p) => sum + p.estoque, 0);

    const produtosMaisVendidos = vendasFiltradas.reduce((acc, venda) => {
      if (!acc[venda.produto_nome]) {
        acc[venda.produto_nome] = { quantidade: 0, receita: 0 };
      }
      acc[venda.produto_nome].quantidade += venda.quantidade;
      acc[venda.produto_nome].receita += venda.total;
      return acc;
    }, {} as Record<string, { quantidade: number; receita: number }>);

    return {
      totalVendas,
      receitaTotal,
      estoqueTotal,
      produtosMaisVendidos,
    };
  }, [vendasFiltradas, produtos]);

  const dadosVendasTempo = useMemo(() => {
    const agrupado = vendasFiltradas.reduce((acc, venda) => {
      const data = new Date(venda.data).toLocaleDateString('pt-BR');
      if (!acc[data]) {
        acc[data] = { data, vendas: 0, receita: 0 };
      }
      acc[data].vendas += venda.quantidade;
      acc[data].receita += venda.total;
      return acc;
    }, {} as Record<string, { data: string; vendas: number; receita: number }>);

    return Object.values(agrupado).sort((a, b) => 
      new Date(a.data.split('/').reverse().join('-')).getTime() - 
      new Date(b.data.split('/').reverse().join('-')).getTime()
    );
  }, [vendasFiltradas]);

  const dadosProdutos = useMemo(() => {
    return Object.entries(resumo.produtosMaisVendidos)
      .map(([nome, dados]) => ({
        nome,
        quantidade: dados.quantidade,
        receita: dados.receita,
      }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);
  }, [resumo.produtosMaisVendidos]);

  const handleExportarPDF = () => {
    const vendasParaExport = vendasFiltradas.map(v => ({
      id: v.id,
      produtoId: v.id,
      produtoNome: v.produto_nome,
      quantidade: v.quantidade,
      precoVenda: v.preco_unitario,
      total: v.total,
      data: v.data
    }));
    exportToPDF(vendasParaExport, produtos, periodo, resumo.totalVendas, resumo.receitaTotal, logoUrl);
  };

  const handleExportarCSV = () => {
    const vendasParaExport = vendasFiltradas.map(v => ({
      id: v.id,
      produtoId: v.id,
      produtoNome: v.produto_nome,
      quantidade: v.quantidade,
      precoVenda: v.preco_unitario,
      total: v.total,
      data: v.data
    }));
    exportToCSV(vendasParaExport, produtos, periodo, resumo.totalVendas, resumo.receitaTotal);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Relatórios e Análises</h2>
          <p className="text-sm text-muted-foreground">
            Visualize o desempenho de vendas e estoque
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={(value: 'semanal' | 'mensal') => setPeriodo(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Última Semana</SelectItem>
              <SelectItem value="mensal">Último Mês</SelectItem>
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
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportarCSV}>
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.totalVendas}</div>
            <p className="text-xs text-muted-foreground">
              {periodo === 'semanal' ? 'últimos 7 dias' : 'últimos 30 dias'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Akz {resumo.receitaTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {periodo === 'semanal' ? 'últimos 7 dias' : 'últimos 30 dias'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumo.estoqueTotal}</div>
            <p className="text-xs text-muted-foreground">unidades disponíveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {dadosVendasTempo.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Vendas</CardTitle>
              <CardDescription>Vendas e receita ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dadosVendasTempo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--primary))" 
                    name="Vendas (un)" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--accent))" 
                    name="Receita (Akz)" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>Top 5 produtos por quantidade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosProdutos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabelas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Produtos</CardTitle>
            <CardDescription>Produtos mais vendidos no período</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosProdutos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhuma venda registrada no período
                    </TableCell>
                  </TableRow>
                ) : (
                  dadosProdutos.map((produto, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell className="text-right">{produto.quantidade}</TableCell>
                      <TableCell className="text-right">Akz {produto.receita.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas Recentes</CardTitle>
            <CardDescription>Últimas vendas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhuma venda registrada no período
                    </TableCell>
                  </TableRow>
                ) : (
                  vendasFiltradas.slice(0, 10).map((venda) => (
                    <TableRow key={venda.id}>
                      <TableCell className="font-medium">{venda.produto_nome}</TableCell>
                      <TableCell className="text-right">{venda.quantidade}</TableCell>
                      <TableCell className="text-right">Akz {venda.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {new Date(venda.data).toLocaleDateString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;