import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Venda {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  precoVenda: number;
  total: number;
  data: string;
}

interface Produto {
  id: string;
  nome: string;
  estoque: number;
}

export const exportToPDF = async (
  vendas: Venda[],
  produtos: Produto[],
  periodo: string,
  totalVendas: number,
  totalReceita: number,
  logoUrl: string
) => {
  const doc = new jsPDF();
  
  // Adicionar logotipo no canto superior direito
  try {
    doc.addImage(logoUrl, 'PNG', 160, 10, 30, 30);
  } catch (error) {
    console.error('Erro ao adicionar logo:', error);
  }

  // Cabeçalho
  doc.setFontSize(20);
  doc.setTextColor(20, 184, 166); // Cor primária teal
  doc.text('Marjoc Lda', 20, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Relatório de Vendas e Estoque', 20, 35);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Período: ${periodo === 'semanal' ? 'Semanal' : 'Mensal'}`, 20, 45);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, 52);

  // Resumo
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Resumo do Período', 20, 65);
  
  doc.setFontSize(11);
  doc.text(`Total de Vendas: ${totalVendas} unidades`, 20, 73);
  doc.text(`Receita Total: Akz ${totalReceita.toFixed(2)}`, 20, 80);
  doc.text(`Produtos em Estoque: ${produtos.reduce((acc, p) => acc + p.estoque, 0)} unidades`, 20, 87);

  // Tabela de Vendas
  doc.setFontSize(14);
  doc.text('Histórico de Vendas', 20, 100);

  autoTable(doc, {
    startY: 105,
    head: [['Data', 'Produto', 'Quantidade', 'Preço Unit.', 'Total']],
    body: vendas.map(v => [
      new Date(v.data).toLocaleDateString('pt-BR'),
      v.produtoNome,
      v.quantidade.toString(),
      `Akz ${v.precoVenda.toFixed(2)}`,
      `Akz ${v.total.toFixed(2)}`
    ]),
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
  });

  // Tabela de Estoque
  const finalY = (doc as any).lastAutoTable.finalY || 105;
  doc.setFontSize(14);
  doc.text('Estoque Atual', 20, finalY + 15);

  autoTable(doc, {
    startY: finalY + 20,
    head: [['Produto', 'Quantidade em Estoque']],
    body: produtos.map(p => [p.nome, p.estoque.toString()]),
    theme: 'striped',
    headStyles: { fillColor: [20, 184, 166] },
  });

  // Salvar PDF
  doc.save(`relatorio-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`);
};

export const exportToCSV = (
  vendas: Venda[],
  produtos: Produto[],
  periodo: string,
  totalVendas: number,
  totalReceita: number
) => {
  let csvContent = '';
  
  // Cabeçalho
  csvContent += 'Marjoc Lda\n';
  csvContent += 'Relatório de Vendas e Estoque\n';
  csvContent += `Período: ${periodo === 'semanal' ? 'Semanal' : 'Mensal'}\n`;
  csvContent += `Data de emissão: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  
  // Resumo
  csvContent += 'RESUMO DO PERÍODO\n';
  csvContent += `Total de Vendas,${totalVendas} unidades\n`;
  csvContent += `Receita Total,Akz ${totalReceita.toFixed(2)}\n`;
  csvContent += `Produtos em Estoque,${produtos.reduce((acc, p) => acc + p.estoque, 0)} unidades\n\n`;
  
  // Histórico de Vendas
  csvContent += 'HISTÓRICO DE VENDAS\n';
  csvContent += 'Data,Produto,Quantidade,Preço Unitário,Total\n';
  vendas.forEach(v => {
    csvContent += `${new Date(v.data).toLocaleDateString('pt-BR')},${v.produtoNome},${v.quantidade},Akz ${v.precoVenda.toFixed(2)},Akz ${v.total.toFixed(2)}\n`;
  });
  
  csvContent += '\n';
  
  // Estoque Atual
  csvContent += 'ESTOQUE ATUAL\n';
  csvContent += 'Produto,Quantidade em Estoque\n';
  produtos.forEach(p => {
    csvContent += `${p.nome},${p.estoque}\n`;
  });

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-${periodo}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
