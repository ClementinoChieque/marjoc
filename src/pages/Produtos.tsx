import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, AlertTriangle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const categorias = [
  "Analgésico",
  "Anti-inflamatório",
  "Antibiótico",
  "Vitaminas",
  "Suplementos",
  "Dermatológicos",
  "Cardiovascular",
  "Respiratório",
  "Outros",
];

const Produtos = () => {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<any | null>(null);
  const [vendaProduto, setVendaProduto] = useState<any | null>(null);
  const [quantidadeVenda, setQuantidadeVenda] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    preco_custo: "",
    preco_venda: "",
    estoque: "",
    validade: "",
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos: " + error.message);
    }
  };

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingProduto) {
        const { error } = await supabase
          .from("produtos")
          .update({
            nome: formData.nome,
            categoria: formData.categoria,
            preco_custo: parseFloat(formData.preco_custo),
            preco_venda: parseFloat(formData.preco_venda),
            estoque: parseInt(formData.estoque),
            validade: formData.validade || null,
          })
          .eq("id", editingProduto.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("produtos")
          .insert([
            {
              nome: formData.nome,
              categoria: formData.categoria,
              preco_custo: parseFloat(formData.preco_custo),
              preco_venda: parseFloat(formData.preco_venda),
              estoque: parseInt(formData.estoque),
              validade: formData.validade || null,
              user_id: user?.id,
            },
          ]);

        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      await fetchProdutos();
      resetForm();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (produto: any) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      preco_custo: produto.preco_custo.toString(),
      preco_venda: produto.preco_venda.toString(),
      estoque: produto.estoque.toString(),
      validade: produto.validade || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Produto excluído com sucesso!");
      await fetchProdutos();
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  const handleVender = async () => {
    if (!vendaProduto || quantidadeVenda <= 0) return;

    if (quantidadeVenda > vendaProduto.estoque) {
      toast.error("Quantidade indisponível em estoque!");
      return;
    }

    setLoading(true);

    try {
      const total = vendaProduto.preco_venda * quantidadeVenda;

      // Registrar venda
      const { error: vendaError } = await supabase
        .from("vendas")
        .insert([
          {
            produto_id: vendaProduto.id,
            produto_nome: vendaProduto.nome,
            quantidade: quantidadeVenda,
            preco_unitario: vendaProduto.preco_venda,
            total: total,
            user_id: user?.id,
          },
        ]);

      if (vendaError) throw vendaError;

      // Atualizar estoque
      const { error: estoqueError } = await supabase
        .from("produtos")
        .update({ estoque: vendaProduto.estoque - quantidadeVenda })
        .eq("id", vendaProduto.id);

      if (estoqueError) throw estoqueError;

      toast.success(`Venda registrada! Total: Akz ${total.toFixed(2)}`);
      setVendaProduto(null);
      setQuantidadeVenda(1);
      await fetchProdutos();
    } catch (error: any) {
      toast.error("Erro ao registrar venda: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      preco_custo: "",
      preco_venda: "",
      estoque: "",
      validade: "",
    });
    setEditingProduto(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos da farmácia
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduto ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoria: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Custo (Akz)</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    value={formData.preco_custo}
                    onChange={(e) =>
                      setFormData({ ...formData, preco_custo: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda (Akz)</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) =>
                      setFormData({ ...formData, preco_venda: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estoque">Quantidade em Estoque</Label>
                <Input
                  id="estoque"
                  type="number"
                  value={formData.estoque}
                  onChange={(e) =>
                    setFormData({ ...formData, estoque: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade">Data de Validade</Label>
                <Input
                  id="validade"
                  type="date"
                  value={formData.validade}
                  onChange={(e) =>
                    setFormData({ ...formData, validade: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço Venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{produto.categoria}</Badge>
                    </TableCell>
                    <TableCell>Akz {produto.preco_venda.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{produto.estoque}</span>
                        {produto.estoque < 30 && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {produto.validade
                        ? new Date(produto.validade).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setVendaProduto(produto);
                            setQuantidadeVenda(1);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(produto)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(produto.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!vendaProduto} onOpenChange={(open) => !open && setVendaProduto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Venda</AlertDialogTitle>
            <AlertDialogDescription>
              {vendaProduto && (
                <div className="space-y-4">
                  <p className="font-medium">Produto: {vendaProduto.nome}</p>
                  <p>Preço: Akz {vendaProduto.preco_venda.toFixed(2)}</p>
                  <p>Disponível: {vendaProduto.estoque} unidades</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="quantidade">Quantidade</Label>
                    <Input
                      id="quantidade"
                      type="number"
                      min="1"
                      max={vendaProduto.estoque}
                      value={quantidadeVenda}
                      onChange={(e) => setQuantidadeVenda(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  
                  <p className="text-lg font-bold">
                    Total: Akz {(vendaProduto.preco_venda * quantidadeVenda).toFixed(2)}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleVender} disabled={loading}>
              {loading ? "Processando..." : "Confirmar Venda"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;
