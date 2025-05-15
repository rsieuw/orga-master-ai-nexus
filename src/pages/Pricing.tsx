// src/pages/Pricing.tsx
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Check, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useToast } from '@/hooks/use-toast.ts';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Interface representing a price object, typically from Stripe.
 * @interface Price
 */
interface Price {
  /** The Stripe Price ID. */
  id: string; 
  /** The unit amount of the price in the smallest currency unit (e.g., cents). Can be null. */
  unit_amount: number | null;
  /** The currency code (e.g., 'eur'). Can be null. */
  currency: string | null;
  /** The billing interval ('month' or 'year'). Can be null for one-time payments or free plans. */
  interval: 'month' | 'year' | null;
}

/**
 * Interface representing a product, typically from Stripe, with associated prices.
 * @interface Product
 */
interface Product {
  /** The product ID. */
  id: string;
  /** The name of the product. Can be null. */
  name: string | null;
  /** A description of the product. Can be null. */
  description: string | null;
  /** An array of strings describing the features included in the product. */
  features: string[]; 
  /** An array of `Price` objects associated with this product. */
  prices: Price[];
}

/**
 * `PricingPage` component displays available subscription plans (products and prices).
 * It fetches product data (currently using placeholder data) and allows users to select a plan.
 * Selecting a plan initiates a Stripe checkout session by calling a Supabase Edge Function.
 * Shows loading states for data fetching and during checkout redirection.
 * Includes a back button for navigation.
 */
export default function PricingPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]); // State for products/prices
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null); // Track for which price-ID is loading

  /**
   * useEffect hook to fetch product and price information.
   * Currently, it uses placeholder data. 
   * TODO: Replace placeholder data with actual Supabase query to fetch active products and their prices.
   * It sets loading states accordingly.
   */
  useEffect(() => {
    const fetchProducts = () => {
      setIsLoading(true);
      // Placeholder data - replace with Supabase query
      // Example: const { data, error } = await supabase.from('products').select('*_prices(*)').eq('active', true);
      // Make sure your query only retrieves active products and prices.
      // Map the data to the Product/Price interfaces.
      const placeholderData: Product[] = [
        { id: 'prod_FREE', name: 'Free', description: 'Basic features', features: ['Standard AI', 'Task Management', 'Basic Support'], prices: [{id: 'free', unit_amount: 0, currency: 'eur', interval: null}] },
        { id: 'prod_PREMIUM', name: 'Premium', description: 'All features unlocked', features: ['Advanced AI (Developer Mode)', 'Priority Support', 'Unlimited Research', 'All Free features'], prices: [
            // Replace with your REAL Stripe Price IDs
            { id: 'price_1RLCFyGgSHdyoLfIYftH2itQ', unit_amount: 1000, currency: 'eur', interval: 'month' },
            // { id: 'price_YEARLY_ID', unit_amount: 10000, currency: 'eur', interval: 'year' },
        ] },
      ];
      setProducts(placeholderData);
      // End placeholder data
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  /**
   * Handles the selection of a subscription plan.
   * If the user is not authenticated or selects the 'free' plan they are already on, it shows a toast.
   * Otherwise, it invokes the 'create-checkout-session' Supabase Edge Function with the selected price ID.
   * On success, it redirects the user to the Stripe checkout URL.
   * Displays loading states and error toasts if the process fails.
   * @param {string} priceId - The Stripe Price ID of the selected plan.
   */
  const handleSelectPlan = async (priceId: string) => {
     if (!session) {
       toast({ variant: "destructive", title: "Error", description: "Session not found. Please log in again." });
       return;
     }
     if (priceId === 'free') {
        toast({ title: "Info", description: "You are already using the free plan." });
        return;
     }

     setIsCheckoutLoading(priceId);
     try {
       const { data, error } = await supabase.functions.invoke("create-checkout-session", {
         body: { priceId }, // Send the selected price-ID
         headers: {
           Authorization: `Bearer ${session.access_token}`,
         }
       });

       if (error) throw error;

       if (data && data.url) {
         globalThis.location.href = data.url; // Redirect to Stripe checkout
       } else {
         throw new Error("No checkout URL received.");
       }

     } catch (error: unknown) {
       console.error("Stripe checkout error:", error);
       const message = error instanceof Error ? error.message : "Could not start checkout session.";
       toast({
         variant: "destructive",
         title: "Upgrade Failed",
         description: message,
       });
     } finally {
       setIsCheckoutLoading(null);
     }
   };

  if (isLoading) {
    // TODO: Implement a better loading state (skeletons?)
    return <AppLayout><div className="flex flex-grow items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex flex-grow flex-col items-center justify-center">
        <div className="w-full max-w-4xl px-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Back
           </Button>
        </div>

        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
            <p className="text-xl text-muted-foreground">Unlock more power with OrgaMaster AI Premium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    {/* Show the price - simplified for now */}
                    {product.prices.find(p => p.interval === 'month' || p.id === 'free') && (
                      <div className="text-3xl font-bold">
                        {product.prices[0].unit_amount !== null ? `€${(product.prices[0].unit_amount / 100).toFixed(2)}` : 'Free'}
                        {product.prices[0].interval && <span className="text-sm font-normal text-muted-foreground"> / month</span>}
                      </div>
                    )}
                     {/* TODO: Add option for yearly price if available */}

                  <ul className="space-y-2">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {product.prices.length > 0 && product.prices[0].id !== 'free' ? (
                     <Button
                       onClick={() => handleSelectPlan(product.prices[0].id)} // Use the first price ID for now
                       disabled={isCheckoutLoading === product.prices[0].id}
                       className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                     >
                        {isCheckoutLoading === product.prices[0].id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isCheckoutLoading === product.prices[0].id ? 'Loading...' : 'Choose Plan'}
                     </Button>
                  ) : product.prices[0]?.id === 'free' ? (
                     <Button disabled className="w-full" variant="outline">Current Plan</Button>
                  ) : null }
                   {/* TODO: Handle yearly button separately */}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 