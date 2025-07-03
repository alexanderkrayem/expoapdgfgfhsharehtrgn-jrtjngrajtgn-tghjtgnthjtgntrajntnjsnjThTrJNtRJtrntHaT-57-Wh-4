// src/components/tabs/ProductsTab.jsx
import React from 'react';
import { Search } from 'lucide-react';
import ProductCard from '../common/ProductCard';

const ProductsTab = ({ products, isLoading, error, onLoadMore, hasMorePages, isLoadingMore, onAddToCart, onToggleFavorite, onShowDetails, favoriteProductIds }) => {
    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><p>جار تحميل المنتجات...</p></div>;
    }

    if (error) {
        return <div className="p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg text-center"><span className="font-medium">خطأ!</span> {error}</div>;
    }
 // DEBUGGING: Log the data to inspect for duplicate or missing IDs
    console.log('[DEBUG] Rendering ProductsTab with products:', products);
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4 text-gray-800">المنتجات المعروضة</h2>
            {products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {products.map(product => (
                        <ProductCard
                            key={`tab-prod-${product.id}`}
                            product={product}
                            onAddToCart={onAddToCart}
                            onToggleFavorite={onToggleFavorite}
                            onShowDetails={onShowDetails}
                            isFavorite={favoriteProductIds.has(product.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10">
                    <Search className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-lg">لا توجد منتجات.</p>
                </div>
            )}

            {hasMorePages && !isLoadingMore && (
                <div className="text-center mt-8 mb-4">
                    <button onClick={onLoadMore} className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-8 rounded-lg">
                        تحميل المزيد
                    </button>
                </div>
            )}
            {isLoadingMore && (
                <div className="flex justify-center items-center h-20 mt-4"><p>جاري تحميل المزيد...</p></div>
            )}
        </div>
    );
};

export default ProductsTab;