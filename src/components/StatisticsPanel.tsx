import { Client, PaymentTracking, StockItem, StockStats } from "@/types/stock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface StatisticsPanelProps {
  stats: StockStats;
  items: StockItem[];
  clients: Client[];
  paymentTrackings: PaymentTracking[];
  currency: string;
}

export function StatisticsPanel({ stats, items, clients, paymentTrackings, currency }: StatisticsPanelProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-DZ", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/[\u00A0\u202F]/g, " ");
  };

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--accent))",
    "hsl(var(--warning))",
    "hsl(var(--destructive))",
    "hsl(var(--muted-foreground))",
    "hsl(210 90% 55%)",
    "hsl(280 80% 55%)",
  ];

  const totalReservedValue = items.reduce(
    (sum, item) => sum + (item.price_ht || 0) * (item.reserved || 0),
    0
  );
  const totalRemainingValue = items.reduce(
    (sum, item) => sum + (item.price_ht || 0) * (item.remaining || 0),
    0
  );
  const totalTracked = paymentTrackings.reduce((sum, p) => sum + (p.amount_willing_to_pay || 0), 0);
  const totalReceived = paymentTrackings.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const totalOutstanding = Math.max(0, totalTracked - totalReceived);
  const paidRate = totalTracked > 0 ? (totalReceived / totalTracked) * 100 : 0;

  const clientBreakdown = clients
    .map((client) => {
      const clientStockItems = items.filter((item) => item.client_id === client.id);
      const clientPayments = paymentTrackings.filter((payment) => payment.client_id === client.id);

      const clientBoughtValue = clientStockItems.reduce(
        (sum, item) => sum + (item.price_ht || 0) * (item.quantity || 0),
        0
      );
      const clientTracked = clientPayments.reduce((sum, p) => sum + (p.amount_willing_to_pay || 0), 0);
      const clientPaid = clientPayments.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
      const clientRemaining = Math.max(0, clientTracked - clientPaid);
      const clientQty = clientStockItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

      return {
        id: client.id,
        name: client.name || client.email || "Client",
        products: clientStockItems.length,
        quantity: clientQty,
        boughtValue: clientBoughtValue,
        tracked: clientTracked,
        paid: clientPaid,
        remaining: clientRemaining,
      };
    })
    .filter((row) => row.products > 0 || row.tracked > 0 || row.paid > 0)
    .sort((a, b) => b.remaining - a.remaining);

  const recentTransactions = [...paymentTrackings]
    .sort((a, b) => {
      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bDate - aDate;
    })
    .slice(0, 12);

  const findClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || client?.email || "Client";
  };

  const findProductLabel = (payment: PaymentTracking) => {
    if (payment.sub_product?.name) return `Sous-produit: ${payment.sub_product.name}`;
    if (payment.product?.description) return `Produit: ${payment.product.description}`;
    const fallback = items.find((item) => item.id === payment.product_id)?.description;
    return fallback ? `Produit: ${fallback}` : "Produit non lié";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words">{stats.totalItems}</p>
            <p className="text-xs font-medium text-muted-foreground">Produits</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words">{stats.totalQuantity}</p>
            <p className="text-xs font-medium text-muted-foreground">Unités totales</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words text-warning">{stats.totalReserved}</p>
            <p className="text-xs font-medium text-muted-foreground">Réservées</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words text-success">{stats.totalRemaining}</p>
            <p className="text-xs font-medium text-muted-foreground">Disponibles</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 transition-all hover:shadow-md">
          <div className="text-center space-y-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight leading-tight break-words">{stats.totalSubProducts}</p>
            <p className="text-xs font-medium text-muted-foreground">Sous-produits</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Pie Chart */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">État du stock</h3>
          </div>
          <div className="p-4 sm:p-5">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.stockByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {stats.stockByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {stats.stockByStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b bg-muted/30">
            <h3 className="font-semibold text-sm">Répartition par catégorie</h3>
          </div>
          <div className="p-4 sm:p-5">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.categoryBreakdown} layout="vertical">
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {stats.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Value Summary */}
      <div className="rounded-xl border overflow-hidden gradient-primary p-6">
        <div className="text-center">
          <p className="text-sm text-white/80 mb-2">Valeur totale estimée du stock</p>
          <p className="text-xl sm:text-4xl font-bold text-white tracking-tight leading-tight break-all px-1">{formatCurrency(stats.totalValue)}</p>
        </div>
      </div>

      {/* Money Flow */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b bg-muted/30">
          <h3 className="font-semibold text-sm">Traçabilité Argent (Entrée / Sortie)</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Suivi global des montants clients, encaissements et soldes restants.
          </p>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-background">
              <p className="text-xs text-muted-foreground">Valeur totale stock</p>
              <p className="text-lg font-bold break-all">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background">
              <p className="text-xs text-muted-foreground">Valeur réservée (sortie potentielle)</p>
              <p className="text-lg font-bold break-all">{formatCurrency(totalReservedValue)}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background">
              <p className="text-xs text-muted-foreground">Valeur restante en stock</p>
              <p className="text-lg font-bold break-all">{formatCurrency(totalRemainingValue)}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background border-green-200">
              <p className="text-xs text-muted-foreground">Entrées enregistrées (versé)</p>
              <p className="text-lg font-bold text-green-700 break-all">{formatCurrency(totalReceived)}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background border-blue-200">
              <p className="text-xs text-muted-foreground">Montants suivis clients</p>
              <p className="text-lg font-bold text-blue-700 break-all">{formatCurrency(totalTracked)}</p>
            </div>
            <div className="rounded-lg border p-3 bg-background border-orange-200">
              <p className="text-xs text-muted-foreground">Reste à encaisser</p>
              <p className="text-lg font-bold text-orange-700 break-all">{formatCurrency(totalOutstanding)}</p>
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2 text-sm mb-2">
              <p className="font-medium">Taux d'encaissement</p>
              <p className="font-semibold">{paidRate.toFixed(1)}%</p>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                style={{ width: `${Math.min(100, paidRate)}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Détail par client</h4>
            {clientBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée client monétaire pour le moment.</p>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {clientBreakdown.map((row) => (
                  <div key={row.id} className="rounded-lg border p-3 bg-background">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <p className="font-medium break-words">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Produits: {row.products} • Qté: {row.quantity}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <p className="break-all">Achat estimé: <span className="font-semibold">{formatCurrency(row.boughtValue)}</span></p>
                      <p className="break-all">Suivi: <span className="font-semibold text-blue-700">{formatCurrency(row.tracked)}</span></p>
                      <p className="break-all">Versé: <span className="font-semibold text-green-700">{formatCurrency(row.paid)}</span></p>
                      <p className="break-all">Reste: <span className="font-semibold text-orange-700">{formatCurrency(row.remaining)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Derniers mouvements</h4>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun mouvement enregistré.</p>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {recentTransactions.map((tx) => {
                  const txRemaining = Math.max(0, (tx.amount_willing_to_pay || 0) - (tx.amount_paid || 0));
                  return (
                    <div key={tx.id} className="rounded-lg border p-3 bg-background">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <p className="text-sm font-medium break-words">{findClientName(tx.client_id)}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.created_at ? new Date(tx.created_at).toLocaleString("fr-FR") : "-"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{findProductLabel(tx)}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-2">
                        <p className="break-all">Suivi: <span className="font-semibold">{formatCurrency(tx.amount_willing_to_pay || 0)}</span></p>
                        <p className="break-all">Entrée: <span className="font-semibold text-green-700">{formatCurrency(tx.amount_paid || 0)}</span></p>
                        <p className="break-all">Reste: <span className="font-semibold text-orange-700">{formatCurrency(txRemaining)}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
