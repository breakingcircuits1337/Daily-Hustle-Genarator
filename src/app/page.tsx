
'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateDailyHustleIdeas, GenerateDailyHustleIdeasOutput } from '@/ai/flows/generate-daily-hustle-ideas';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, CheckSquare, Trash2, Loader2, DollarSign, ExternalLink, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  userSkills: z.string().min(1, { message: 'Please enter at least one skill.' }),
  targetAmount: z.coerce // Use coerce to convert string input to number
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(0.01, { message: 'Target amount must be at least $0.01.' }) // Allow small amounts
    .positive({ message: 'Target amount must be positive.' }),
});

type FormData = z.infer<typeof formSchema>;

interface Idea {
  id: string;
  text: string;
  websites: string[];
}

interface AffiliateLink {
  url: string;
  title: string;
  description: string;
  category?: string;
}

const affiliateLinks: AffiliateLink[] = [
  {
    url: "https://16aaa2yclbv-au53ybvbkpvre4.hop.clickbank.net",
    title: "Air Fountain: Turn Air Into Water",
    description: "Discover how to turn air into water. A unique offer in the self-help and survival niche.",
    category: "Survival",
  },
  {
    url: "https://728475ymtb0y0pads6p-bgl68r.hop.clickbank.net",
    title: "Nano-Ease: Pain Relief Technology",
    description: "Explore this nano-technology pain relief solution in health & fitness dietary supplements.",
    category: "Health & Fitness",
  },
  {
    url: "https://36db9-ueu3s13n5pmkpeeiso7d.hop.clickbank.net", // CPA link, assumed
    title: "Exclusive CPA Offer",
    description: "Check out this special Cost Per Acquisition offer for online marketers.",
    category: "Online Marketing",
  },
  {
    url: "https://8d0b45-8xdv41mboagolp12gy7.hop.clickbank.net",
    title: "DIY 3D Solar Panel Guide",
    description: "Learn to build your own 3D solar panel with this high-converting video guide.",
    category: "DIY & Energy",
  },
  {
    url: "https://e7164-tln215cw95vcsi4p1wes.hop.clickbank.net",
    title: "High-Converting Personal Development Offer",
    description: "Tap into personal development, internet marketing, and health niches. Potential to earn up to $250 per sale.",
    category: "Personal Development",
  },
  {
    url: "https://641337uhqcsx1n69ozpo1phz2i.hop.clickbank.net",
    title: "Learn to Sketch Easily",
    description: "An easy-to-follow course for anyone wanting to master the art of sketching, with practical methods and tips.",
    category: "Art & Hobbies",
  }
];


export default function Home() {
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [highlightedOffer, setHighlightedOffer] = useState<AffiliateLink | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSkills: '',
      targetAmount: 3,
    },
  });

  useEffect(() => {
    const storedIdeas = localStorage.getItem('savedHustleIdeas');
    if (storedIdeas) {
      try {
        const parsedIdeas = JSON.parse(storedIdeas) as Idea[];
        if (Array.isArray(parsedIdeas) && parsedIdeas.every(item => typeof item.id === 'string' && typeof item.text === 'string' && Array.isArray(item.websites))) {
          setSavedIdeas(parsedIdeas);
        } else {
          console.error("Loaded data from localStorage has invalid format:", parsedIdeas);
          localStorage.removeItem('savedHustleIdeas');
        }
      } catch (error) {
        console.error("Failed to parse saved ideas from localStorage", error);
        localStorage.removeItem('savedHustleIdeas');
      }
    }
  }, []);

  useEffect(() => {
    if (savedIdeas.length > 0) {
      try {
        localStorage.setItem('savedHustleIdeas', JSON.stringify(savedIdeas));
      } catch (error) {
         console.error("Failed to save ideas to localStorage", error);
      }
    } else {
       localStorage.removeItem('savedHustleIdeas');
    }
  }, [savedIdeas]);

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setGeneratedIdeas([]);
    setHighlightedOffer(null); // Clear previous highlighted offer
    try {
      const result: GenerateDailyHustleIdeasOutput = await generateDailyHustleIdeas({
         userSkills: values.userSkills,
         targetAmount: values.targetAmount
      });
      if (result && typeof result.ideas !== 'undefined' && Array.isArray(result.ideas)) {
        const newIdeas = result.ideas.map((ideaObj, index) => ({
          id: `gen-${Date.now()}-${index}`,
          text: ideaObj.idea,
          websites: ideaObj.suggestedWebsites || [],
        }));
        setGeneratedIdeas(newIdeas);

        if (affiliateLinks.length > 0) {
          const randomIndex = Math.floor(Math.random() * affiliateLinks.length);
          setHighlightedOffer(affiliateLinks[randomIndex]);
        }

      } else {
        console.error("Invalid response format from generateDailyHustleIdeas:", result);
        toast({
          title: 'Error',
          description: 'Failed to generate ideas. Unexpected response format.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      let description = 'An error occurred while generating ideas. Please try again.';
      if (error instanceof Error && error.message.includes("prompt was blocked")) {
        description = "The request was blocked by safety settings. Try modifying your input.";
      } else if (error instanceof Error && error.message.includes("invalid URLs")) {
        description = "The AI returned some invalid website links. We're showing the ideas anyway.";
        if ((error.cause as any)?.ideas) { 
           const partialIdeas = (error.cause as any).ideas.map((ideaObj:any, index:number) => ({
            id: `gen-err-${Date.now()}-${index}`,
            text: ideaObj.idea,
            websites: Array.isArray(ideaObj.suggestedWebsites) ? ideaObj.suggestedWebsites.filter((ws: any) => typeof ws === 'string') : [],
          }));
          setGeneratedIdeas(partialIdeas);
           // Optionally, still set a highlighted offer on partial success
           if (affiliateLinks.length > 0) {
            const randomIndex = Math.floor(Math.random() * affiliateLinks.length);
            setHighlightedOffer(affiliateLinks[randomIndex]);
          }
        }
      }
      toast({
        title: 'Error Generating Ideas',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

   const saveIdea = (ideaToSave: Idea) => {
    if (!savedIdeas.some(idea => idea.id === ideaToSave.id)) {
      setSavedIdeas(prev => [...prev, ideaToSave]);
      toast({
        title: 'Idea Saved',
        description: `"${ideaToSave.text.substring(0, 30)}..." saved successfully.`,
        variant: 'default',
      });
    } else {
      toast({
        title: 'Already Saved',
        description: 'This idea is already in your saved list.',
        variant: 'default',
      });
    }
  };

  const removeSavedIdea = (idToRemove: string) => {
    setSavedIdeas(prev => prev.filter(idea => idea.id !== idToRemove));
    toast({
      title: 'Idea Removed',
      description: 'The idea has been removed from your saved list.',
       variant: 'default',
    });
  };

  const renderWebsiteLinks = (websites: string[]) => {
    if (!websites || websites.length === 0) {
      return <span className="text-xs text-muted-foreground italic">No websites suggested.</span>;
    }
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {websites.map((url, index) => {
          try {
            const validUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
            return (
              <a
                key={index}
                href={validUrl.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-xs text-primary hover:underline inline-flex items-center"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {validUrl.hostname}
              </a>
            );
          } catch (e) {
            return (
              <span key={index} className="text-xs text-muted-foreground italic" title={`Invalid URL: ${url}`}>
                {url.length > 30 ? `${url.substring(0, 27)}...` : url} (invalid link)
              </span>
            );
          }
        })}
      </div>
    );
  };


  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8 bg-secondary">
      <Card className="w-full max-w-3xl shadow-lg mb-auto mt-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Daily Hustle Generator</CardTitle>
          <CardDescription>Find ways to earn an extra target amount each day, with website suggestions!</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Skills</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., writing, design" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter skills (comma-separated).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Daily Earning ($)</FormLabel>
                       <FormControl>
                         <div className="relative">
                           <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                           <Input type="number" placeholder="e.g., 3" className="pl-8" {...field} step="0.01" min="0.01"/>
                         </div>
                      </FormControl>
                      <FormDescription>
                        How much do you want to earn?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Ideas...
                  </>
                ) : (
                  'Generate Ideas & Websites'
                )}
              </Button>
            </form>
          </Form>

          {isLoading && (
             <div className="mt-8 flex justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}

          {!isLoading && highlightedOffer && (
            <div className="mt-8">
              <Card className="border-2 border-primary shadow-xl bg-gradient-to-r from-primary/5 via-card to-accent/5 p-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center text-primary">
                     <Gift className="mr-2 h-5 w-5" />
                     Boost Your Hustle!
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="p-3 border rounded-lg shadow-sm bg-card flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-1">{highlightedOffer.title}</h3>
                      {highlightedOffer.category && <Badge variant="secondary" className="mb-2 text-xs">{highlightedOffer.category}</Badge>}
                      <p className="text-sm text-muted-foreground mb-3">{highlightedOffer.description}</p>
                    </div>
                    <Button asChild variant="default" size="sm" className="mt-auto w-full sm:w-auto self-start">
                      <a href={highlightedOffer.url} target="_blank" rel="noopener noreferrer nofollow">
                        Check it out <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {generatedIdeas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><List className="mr-2 h-5 w-5" /> Generated Ideas</h2>
              <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-background">
                <ul className="space-y-4">
                  {generatedIdeas.map((idea) => (
                    <li key={idea.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 rounded hover:bg-muted/50 border-b last:border-b-0">
                       <div className="flex-1 mb-2 sm:mb-0 sm:mr-4">
                         <p className="font-medium">{idea.text}</p>
                         {renderWebsiteLinks(idea.websites)}
                      </div>
                       <Button variant="ghost" size="sm" onClick={() => saveIdea(idea)} aria-label="Save Idea" className="text-accent hover:text-accent-foreground hover:bg-accent/10 self-start sm:self-center shrink-0">
                        <CheckSquare className="h-4 w-4 mr-1 sm:mr-0" />
                        <span className="sm:sr-only">Save</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {savedIdeas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><CheckSquare className="mr-2 h-5 w-5 text-accent" /> Saved Ideas</h2>
              <ScrollArea className="h-[250px] w-full rounded-md border p-4 bg-background">
                 <ul className="space-y-4">
                  {savedIdeas.map((idea) => (
                     <li key={idea.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 rounded hover:bg-muted/50 border-b last:border-b-0">
                       <div className="flex-1 mb-2 sm:mb-0 sm:mr-4">
                         <p className="font-medium">{idea.text}</p>
                         {renderWebsiteLinks(idea.websites)}
                       </div>
                       <Button variant="ghost" size="sm" onClick={() => removeSavedIdea(idea.id)} aria-label="Remove Idea" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 self-start sm:self-center shrink-0">
                         <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                         <span className="sm:sr-only">Remove</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {affiliateLinks.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Gift className="mr-2 h-5 w-5 text-primary" /> More Recommended Offers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {affiliateLinks.filter(link => !highlightedOffer || link.url !== highlightedOffer.url).map((link, index) => (
                  <div key={index} className="p-4 border rounded-lg shadow-sm bg-card hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-primary mb-1">{link.title}</h3>
                      {link.category && <Badge variant="secondary" className="mb-2 text-xs">{link.category}</Badge>}
                      <p className="text-sm text-muted-foreground mb-3">{link.description}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="mt-auto w-full sm:w-auto self-start">
                      <a href={link.url} target="_blank" rel="noopener noreferrer nofollow">
                        Learn More <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </CardContent>
      </Card>
      <footer className="w-full text-center p-4 text-sm text-muted-foreground">
        {currentYear !== null ? (
          <p>&copy; {currentYear} Daily Hustle Generator. Sparking your next side gig.</p>
        ) : (
          <p>&copy; Daily Hustle Generator. Sparking your next side gig.</p> 
        )}
      </footer>
    </main>
  );
}
