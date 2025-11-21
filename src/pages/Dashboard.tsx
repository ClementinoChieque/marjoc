import { Card } from "@/components/ui/card";
import { Users, Package, TrendingUp, AlertTriangle } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Clientes",
      value: "2",
      icon: Users,
      description: "Clientes cadastrados",
      color: "text-primary",
    },
    {
      title: "Total de Produtos",
      value: "3",
      icon: Package,
      description: "Produtos no sistema",
      color: "text-primary",
    },
    {
      title: "Produtos em Falta",
      value: "1",
      icon: AlertTriangle,
      description: "Estoque abaixo do mínimo",
      color: "text-warning",
    },
    {
      title: "Valor em Estoque",
      value: "Akz 3.847,50",
      icon: TrendingUp,
      description: "Valor total estimado",
      color: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Visão geral do sistema Marjoc
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
            <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Ibuprofeno 600mg</p>
                <p className="text-sm text-muted-foreground">
                  Estoque: 25 unidades (mínimo: 30)
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Ações Rápidas
          </h3>
          <div className="space-y-2">
            <button className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary">
              <p className="font-medium text-foreground">Registrar Nova Venda</p>
              <p className="text-sm text-muted-foreground">
                Adicionar uma nova transação
              </p>
            </button>
            <button className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary">
              <p className="font-medium text-foreground">Entrada de Produtos</p>
              <p className="text-sm text-muted-foreground">
                Registrar nova compra de estoque
              </p>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
