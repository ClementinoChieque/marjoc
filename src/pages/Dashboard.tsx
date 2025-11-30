import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalProdutos: 0,
    produtosEmFalta: 0,
    valorEstoque: 0,
  });
  const [produtosBaixoEstoque, setProdutosBaixoEstoque] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Total de clientes
      const { count: clientesCount } = await supabase
        .from("clientes")
        .select("*", { count: "exact", head: true });

      // Total de produtos e estoque
      const { data: produtos } = await supabase
        .from("produtos")
        .select("*");

      const totalProdutos = produtos?.length || 0;
      const produtosEmFalta = produtos?.filter(p => p.estoque < 30).length || 0;
      const valorEstoque = produtos?.reduce((acc, p) => acc + (p.preco_venda * p.estoque), 0) || 0;

      setStats({
        totalClientes: clientesCount || 0,
        totalProdutos,
        produtosEmFalta,
        valorEstoque,
      });

      setProdutosBaixoEstoque(produtos?.filter(p => p.estoque < 30) || []);
    } catch (error: any) {
      toast.error("Erro ao carregar estatísticas: " + error.message);
    }
  };

  const statsCards = [
    {
      title: "Total de Clientes",
      value: stats.totalClientes.toString(),
      icon: Users,
      description: "Clientes cadastrados",
      color: "text-primary",
    },
    {
      title: "Total de Produtos",
      value: stats.totalProdutos.toString(),
      icon: Package,
      description: "Produtos no sistema",
      color: "text-primary",
    },
    {
      title: "Produtos em Falta",
      value: stats.produtosEmFalta.toString(),
      icon: AlertTriangle,
      description: "Estoque abaixo do mínimo",
      color: "text-warning",
    },
    {
      title: "Valor em Estoque",
      value: `Akz ${stats.valorEstoque.toFixed(2)}`,
      icon: TrendingUp,
      description: "Valor total estimado",
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={`rounded-full bg-secondary p-3 ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Alertas de Estoque
          </h3>
          <div className="space-y-3">
            {produtosBaixoEstoque.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum alerta de estoque
              </p>
            ) : (
              produtosBaixoEstoque.map((produto) => (
                <div
                  key={produto.id}
                  className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3"
                >
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{produto.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      Estoque: {produto.estoque} unidades (mínimo: 30)
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
