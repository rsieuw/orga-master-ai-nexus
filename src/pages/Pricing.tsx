// src/pages/Pricing.tsx
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout.tsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Check, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client.ts';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useToast } from '@/hooks/use-toast.ts';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Placeholder interface - pas aan op basis van je DB structuur
interface Price {
  id: string; // Stripe Price ID
  unit_amount: number | null;
  currency: string | null;
  interval: 'month' | 'year' | null;
}

// Placeholder interface - pas aan op basis van je DB structuur
interface Product {
  id: string;
  name: string | null;
  description: string | null;
  features: string[]; // Voeg een manier toe om features op te slaan/ophalen
  prices: Price[];
}

export default function PricingPage() {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]); // State voor producten/prijzen
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(null); // Houd bij voor welke prijs-ID wordt geladen

  // TODO: Implementeer data fetching logica
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      // Placeholder data - vervang door Supabase query
      // Voorbeeld: const { data, error } = await supabase.from('products').select('*_prices(*)').eq('active', true);
      // Zorg ervoor dat je query alleen actieve producten en prijzen ophaalt.
      // Map de data naar de Product/Price interfaces.
      const placeholderData: Product[] = [
        { id: 'prod_FREE', name: 'Gratis', description: 'Basis functionaliteiten', features: ['Standaard AI', 'Taakbeheer', 'Basis Ondersteuning'], prices: [{id: 'free', unit_amount: 0, currency: 'eur', interval: null}] },
        { id: 'prod_PREMIUM', name: 'Premium', description: 'Alle functies ontgrendeld', features: ['Geavanceerde AI (Developer Mode)', 'Prioriteitsondersteuning', 'Onbeperkt Onderzoek', 'Alle Gratis functies'], prices: [
            // Vervang door je ECHTE Stripe Price IDs
            { id: 'price_1RLCFyGgSHdyoLfIYftH2itQ', unit_amount: 1000, currency: 'eur', interval: 'month' },
            // { id: 'price_YEARLY_ID', unit_amount: 10000, currency: 'eur', interval: 'year' },
        ] },
      ];
      setProducts(placeholderData);
      // Einde placeholder data
      setIsLoading(false);
    };

    fetchProducts();
  }, []);

  const handleSelectPlan = async (priceId: string) => {
     if (!session) {
       toast({ variant: "destructive", title: "Fout", description: "Sessie niet gevonden. Log opnieuw in." });
       return;
     }
     if (priceId === 'free') {
        toast({ title: "Info", description: "Je gebruikt al het gratis plan." });
        return;
     }

     setIsCheckoutLoading(priceId);
     try {
       const { data, error } = await supabase.functions.invoke("create-checkout-session", {
         body: { priceId }, // Stuur de geselecteerde prijs-ID mee
         headers: {
           Authorization: `Bearer ${session.access_token}`,
         }
       });

       if (error) throw error;

       if (data && data.url) {
         window.location.href = data.url; // Stuur door naar Stripe checkout
       } else {
         throw new Error("Geen checkout URL ontvangen.");
       }

     } catch (error: unknown) {
       console.error("Stripe checkout error:", error);
       const message = error instanceof Error ? error.message : "Kon geen checkout sessie starten.";
       toast({
         variant: "destructive",
         title: "Upgrade Mislukt",
         description: message,
       });
     } finally {
       setIsCheckoutLoading(null);
     }
   };

  if (isLoading) {
    // TODO: Implementeer een betere loading state (skeletons?)
    return <AppLayout><div className="flex flex-grow items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex flex-grow flex-col items-center justify-center">
        <div className="w-full max-w-4xl px-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Terug
           </Button>
        </div>

        <div>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Kies jouw Plan</h1>
            <p className="text-xl text-muted-foreground">Ontgrendel meer kracht met OrgaMaster AI Premium.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {products.map((product) => (
              <Card key={product.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    {/* Toon de prijs - vereenvoudigd voor nu */}
                    {product.prices.find(p => p.interval === 'month' || p.id === 'free') && (
                      <div className="text-3xl font-bold">
                        {product.prices[0].unit_amount !== null ? `€${(product.prices[0].unit_amount / 100).toFixed(2)}` : 'Gratis'}
                        {product.prices[0].interval && <span className="text-sm font-normal text-muted-foreground"> / maand</span>}
                      </div>
                    )}
                     {/* TODO: Voeg optie toe voor jaarlijkse prijs indien beschikbaar */}

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
                       onClick={() => handleSelectPlan(product.prices[0].id)} // Gebruik de eerste prijs ID voor nu
                       disabled={isCheckoutLoading === product.prices[0].id}
                       className="w-full bg-gradient-to-r from-blue-700 to-purple-800 hover:from-blue-800 hover:to-purple-900 text-white"
                     >
                        {isCheckoutLoading === product.prices[0].id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isCheckoutLoading === product.prices[0].id ? 'Bezig...' : 'Kies Plan'}
                     </Button>
                  ) : product.prices[0]?.id === 'free' ? (
                     <Button disabled className="w-full" variant="outline">Huidig Plan</Button>
                  ) : null }
                   {/* TODO: Handel jaarlijkse knop apart af */}
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
} 