'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { generateDailyHustleIdeas } from '@/ai/flows/generate-daily-hustle-ideas';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, CheckSquare, Trash2, Loader2, DollarSign } from 'lucide-react';

const formSchema = z.object({
  userSkills: z.string().min(1, { message: 'Please enter at least one skill.' }),
  targetAmount: z.coerce // Use coerce to convert string input to number
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .min(1, { message: 'Target amount must be at least $1.' })
    .positive({ message: 'Target amount must be positive.' }),
});

type FormData = z.infer<typeof formSchema>;

interface Idea {
  id: string;
  text: string;
}

export default function Home() {
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userSkills: '',
      targetAmount: 3, // Default target amount
    },
  });

  // Load saved ideas from localStorage on component mount
  useEffect(() => {
    const storedIdeas = localStorage.getItem('savedHustleIdeas');
    if (storedIdeas) {
      try {
        const parsedIdeas = JSON.parse(storedIdeas);
        // Ensure parsed data is an array before setting state
        if (Array.isArray(parsedIdeas)) {
          setSavedIdeas(parsedIdeas);
        } else {
          console.error("Loaded data from localStorage is not an array:", parsedIdeas);
          localStorage.removeItem('savedHustleIdeas'); // Clear invalid data
        }
      } catch (error) {
        console.error("Failed to parse saved ideas from localStorage", error);
        localStorage.removeItem('savedHustleIdeas'); // Clear corrupted data
      }
    }
  }, []);


  // Save ideas to localStorage whenever savedIdeas state changes
  useEffect(() => {
    // Only save if there are ideas to prevent saving "[]" or corrupted data
    if (savedIdeas.length > 0) {
      try {
        localStorage.setItem('savedHustleIdeas', JSON.stringify(savedIdeas));
      } catch (error) {
         console.error("Failed to save ideas to localStorage", error);
      }
    } else {
       // Clear localStorage if no ideas are saved
       localStorage.removeItem('savedHustleIdeas');
    }
  }, [savedIdeas]);


  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setGeneratedIdeas([]); // Clear previous ideas
    try {
      // generateDailyHustleIdeas expects a number for targetAmount
      const result = await generateDailyHustleIdeas({
         userSkills: values.userSkills,
         targetAmount: values.targetAmount // Already a number due to zod coerce
      });
      if (result && result.ideas && Array.isArray(result.ideas)) {
        const newIdeas = result.ideas.map((idea, index) => ({
          id: `gen-${Date.now()}-${index}`, // Simple unique ID
          text: idea,
        }));
        setGeneratedIdeas(newIdeas);
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
      toast({
        title: 'Error',
        description: 'An error occurred while generating ideas. Please try again.',
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 bg-secondary">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Daily Hustle Generator</CardTitle>
          <CardDescription>Find ways to earn an extra target amount each day!</CardDescription>
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
                  'Generate Ideas'
                )}
              </Button>
            </form>
          </Form>

          {isLoading && (
             <div className="mt-8 flex justify-center">
               <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          )}

          {generatedIdeas.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 flex items-center"><List className="mr-2 h-5 w-5" /> Generated Ideas</h2>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background">
                <ul className="space-y-2">
                  {generatedIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{idea.text}</span>
                       <Button variant="ghost" size="sm" onClick={() => saveIdea(idea)} aria-label="Save Idea" className="text-accent hover:text-accent-foreground hover:bg-accent/10">
                        <CheckSquare className="h-4 w-4" />
                        <span className="sr-only">Save Idea</span>
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
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background">
                <ul className="space-y-2">
                  {savedIdeas.map((idea) => (
                    <li key={idea.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <span>{idea.text}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeSavedIdea(idea.id)} aria-label="Remove Idea" className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                         <span className="sr-only">Remove Idea</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
