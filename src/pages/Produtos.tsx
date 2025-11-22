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

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  validade: string | null;
}

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
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [vendaProduto, setVendaProduto] = useState<Produto | null>(null);
  const [quantidadeVenda, setQuantidadeVenda] = useState("");
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
  }, [user]);

  const fetchProdutos = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('produtos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error("Erro ao carregar produtos");
      console.error(error);
    } else {
      setProdutos(data || []);
    }
    setLoading(false);
  };

  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const produtoData = {
      nome: formData.nome,
      categoria: formData.categoria,
      preco_custo: parseFloat(formData.preco_custo),
      preco_venda: parseFloat(formData.preco_venda),
      estoque: parseInt(formData.estoque),
      validade: formData.validade || null,
    };
    
    if (editingProduto) {
      const { error } = await supabase
        .from('produtos')
        .update(produtoData)
        .eq('id', editingProduto.id);

      if (error) {
        toast.error("Erro ao atualizar produto");
        console.error(error);
      } else {
        toast.success("Produto atualizado com sucesso!");
        fetchProdutos();
      }
    } else {
      const { error } = await supabase
        .from('produtos')
        .insert({
          ...produtoData,
          user_id: user.id,
        });

      if (error) {
        toast.error("Erro ao cadastrar produto");
        console.error(error);
      } else {
        toast.success("Produto cadastrado com sucesso!");
        fetchProdutos();
      }
    }
    
    resetForm();
  };

  const handleEdit = (produto: Produto) => {
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
    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Erro ao excluir produto");
      console.error(error);
    } else {
      toast.success("Produto excluído com sucesso!");
      fetchProdutos();
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
    setIsDialogOpen(false);
  };

  const handleVender = async () => {
    if (!vendaProduto || !quantidadeVenda || !user) return;
    
    const quantidade = parseInt(quantidadeVenda);
    
    if (quantidade <= 0) {
      toast.error("Quantidade inválida!");
      return;
    }
    
    if (quantidade > vendaProduto.estoque) {
      toast.error("Estoque insuficiente!");
      return;
    }
    
    // Atualizar estoque do produto
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ estoque: vendaProduto.estoque - quantidade })
      .eq('id', vendaProduto.id);

    if (updateError) {
      toast.error("Erro ao atualizar estoque");
      console.error(updateError);
      return;
    }
    
    // Registrar venda
    const { error: insertError } = await supabase
      .from('vendas')
      .insert({
        user_id: user.id,
        produto_id: vendaProduto.id,
        produto_nome: vendaProduto.nome,
        quantidade,
        preco_unitario: vendaProduto.preco_venda,
        total: vendaProduto.preco_venda * quantidade,
      });

    if (insertError) {
      toast.error("Erro ao registrar venda");
      console.error(insertError);
      return;
    }
    
    toast.success(`Venda de ${quantidade} unidade(s) registrada com sucesso!`);
    setVendaProduto(null);
    setQuantidadeVenda("");
    fetchProdutos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie o estoque e produtos da farmácia
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduto ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Produto *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Dipirona 500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
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
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preco_custo">Preço de Compra (Akz) *</Label>
                  <Input
                    id="preco_custo"
                    type="number"
                    step="0.01"
                    required
                    value={formData.preco_custo}
                    onChange={(e) => setFormData({ ...formData, preco_custo: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda (Akz) *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    required
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estoque">Quantidade em Estoque *</Label>
                  <Input
                    id="estoque"
                    type="number"
                    required
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validade">Data de Validade</Label>
                  <Input
                    id="validade"
                    type="date"
                    value={formData.validade}
                    onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduto ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
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
                        {produto.estoque < 20 && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {produto.validade 
                        ? new Date(produto.validade).toLocaleDateString('pt-BR')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVendaProduto(produto)}
                          title="Vender"
                        >
                          <ShoppingCart className="h-4 w-4 text-primary" />
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
              Produto: <strong>{vendaProduto?.nome}</strong>
              <br />
              Estoque disponível: <strong>{vendaProduto?.estoque}</strong> unidades
              <br />
              Preço unitário: <strong>Akz {vendaProduto?.preco_venda.toFixed(2)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="quantidadeVenda">Quantidade a vender *</Label>
            <Input
              id="quantidadeVenda"
              type="number"
              min="1"
              max={vendaProduto?.estoque}
              value={quantidadeVenda}
              onChange={(e) => setQuantidadeVenda(e.target.value)}
              placeholder="Informe a quantidade"
            />
            {quantidadeVenda && vendaProduto && (
              <p className="text-sm text-muted-foreground">
                Total: <strong>Akz {(parseFloat(quantidadeVenda) * vendaProduto.preco_venda).toFixed(2)}</strong>
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setVendaProduto(null);
              setQuantidadeVenda("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleVender}>
              Confirmar Venda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Produtos;