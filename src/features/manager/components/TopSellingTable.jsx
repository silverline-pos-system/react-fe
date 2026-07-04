import { useEffect, useState } from "react";
import { getTopSellingProducts } from "../services/managerService";

export default function TopSellingTable() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getTopSellingProducts(5);
        setProducts(data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching top selling products:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 font-bold text-slate-800">Company Top Selling Products (This Week)</div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Units</th>
              <th className="text-left p-3">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center text-brand-muted" colSpan={3}>
                  Loading products...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="p-6 text-center text-red-600" colSpan={3}>
                  {error}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-brand-muted" colSpan={3}>
                  No products available
                </td>
              </tr>
            ) : (
              products.map((p, i) => (
                <tr key={i} className="border-t hover:bg-slate-50">
                  <td className="p-3 font-bold">{p.name}</td>
                  <td className="p-3">{p.units}</td>
                  <td className="p-3">{p.revenue}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
