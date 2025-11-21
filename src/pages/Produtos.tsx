import { useState } from "react";
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

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  precoCompra: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
  validade: string;
  codigo: string;
}

interface Venda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoVenda: number;
  total: number;
  data: string;
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
  const [produtos, setProdutos] = useState<Produto[]>([
    {
      id: "1",
      nome: "Dipirona 500mg",
      categoria: "Analgésico",
      precoCompra: 5.50,
      precoVenda: 12.90,
      estoque: 150,
      estoqueMinimo: 50,
      validade: "2025-12-31",
      codigo: "7891234567890"
    },
    {
      id: "2",
      nome: "Ibuprofeno 600mg",
      categoria: "Anti-inflamatório",
      precoCompra: 8.20,
      precoVenda: 18.50,
      estoque: 25,
      estoqueMinimo: 30,
      validade: "2025-08-15",
      codigo: "7891234567891"
    },
    {
      id: "3",
      nome: "Vitamina C 1g",
      categoria: "Vitaminas",
      precoCompra: 15.00,
      precoVenda: 32.90,
      estoque: 80,
      estoqueMinimo: 40,
      validade: "2026-03-20",
      codigo: "7891234567892"
    }
  ]);
  
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [vendaProduto, setVendaProduto] = useState<Produto | null>(null);
  const [quantidadeVenda, setQuantidadeVenda] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    precoCompra: "",
    precoVenda: "",
    estoque: "",
    estoqueMinimo: "",
    validade: "",
    codigo: "",
  });

  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.codigo.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const produtoData = {
      nome: formData.nome,
      categoria: formData.categoria,
      precoCompra: parseFloat(formData.precoCompra),
      precoVenda: parseFloat(formData.precoVenda),
      estoque: parseInt(formData.estoque),
      estoqueMinimo: parseInt(formData.estoqueMinimo),
      validade: formData.validade,
      codigo: formData.codigo,
    };
    
    if (editingProduto) {
      setProdutos(produtos.map((p) =>
        p.id === editingProduto.id ? { ...produtoData, id: p.id } : p
      ));
      toast.success("Produto atualizado com sucesso!");
    } else {
      const novoProduto = {
        ...produtoData,
        id: Date.now().toString(),
      };
      setProdutos([...produtos, novoProduto]);
      toast.success("Produto cadastrado com sucesso!");
    }
    
    resetForm();
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      precoCompra: produto.precoCompra.toString(),
      precoVenda: produto.precoVenda.toString(),
      estoque: produto.estoque.toString(),
      estoqueMinimo: produto.estoqueMinimo.toString(),
      validade: produto.validade,
      codigo: produto.codigo,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProdutos(produtos.filter((p) => p.id !== id));
    toast.success("Produto excluído com sucesso!");
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      precoCompra: "",
      precoVenda: "",
      estoque: "",
      estoqueMinimo: "",
      validade: "",
      codigo: "",
    });
    setEditingProduto(null);
    setIsDialogOpen(false);
  };

  const isEstoqueBaixo = (produto: Produto) => produto.estoque <= produto.estoqueMinimo;

  const handleVender = () => {
    if (!vendaProduto || !quantidadeVenda) return;
    
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
    setProdutos(produtos.map((p) =>
      p.id === vendaProduto.id ? { ...p, estoque: p.estoque - quantidade } : p
    ));
    
    // Registrar venda
    const novaVenda: Venda = {
      id: Date.now().toString(),
      produtoId: vendaProduto.id,
      produtoNome: vendaProduto.nome,
      quantidade,
      precoVenda: vendaProduto.precoVenda,
      total: vendaProduto.precoVenda * quantidade,
      data: new Date().toISOString(),
    };
    
    setVendas([...vendas, novaVenda]);
    
    toast.success(`Venda de ${quantidade} unidade(s) registrada com sucesso!`);
    setVendaProduto(null);
    setQuantidadeVenda("");
  };

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
                  <Label htmlFor="precoCompra">Preço de Compra (Akz) *</Label>
                  <Input
                    id="precoCompra"
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoCompra}
                    onChange={(e) => setFormData({ ...formData, precoCompra: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precoVenda">Preço de Venda (Akz) *</Label>
                  <Input
                    id="precoVenda"
                    type="number"
                    step="0.01"
                    required
                    value={formData.precoVenda}
                    onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
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
                  <Label htmlFor="estoqueMinimo">Estoque Mínimo *</Label>
                  <Input
                    id="estoqueMinimo"
                    type="number"
                    required
                    value={formData.estoqueMinimo}
                    onChange={(e) => setFormData({ ...formData, estoqueMinimo: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="validade">Data de Validade *</Label>
                  <Input
                    id="validade"
                    type="date"
                    required
                    value={formData.validade}
                    onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código/Código de Barras *</Label>
                  <Input
                    id="codigo"
                    required
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="7891234567890"
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
              placeholder="Buscar por nome, categoria ou código..."
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
                    <TableCell>Akz {produto.precoVenda.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{produto.estoque}</span>
                        {isEstoqueBaixo(produto) && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(produto.validade).toLocaleDateString('pt-BR')}
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
              Preço unitário: <strong>Akz {vendaProduto?.precoVenda.toFixed(2)}</strong>
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
                Total: <strong>Akz {(parseFloat(quantidadeVenda) * vendaProduto.precoVenda).toFixed(2)}</strong>
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
