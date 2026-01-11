/**
 * Pagină de test pentru componentele UI shadcn/ui.
 * Demonstrează funcționalitatea tuturor componentelor instalate și theme toggle.
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeToggle } from '@/components/common/theme-toggle';

/**
 * Pagină de test pentru componentele UI.
 * Accesibilă la /test-ui pentru verificare manuală.
 */
export default function TestUIPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Test Componente UI shadcn/ui</h1>
        <ThemeToggle />
      </div>

      {/* Buttons Section */}
      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
          <CardDescription>Diferite variante de butoane</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">🎨</Button>
        </CardContent>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
          <CardDescription>Câmpuri de input</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Email" type="email" />
          <Input placeholder="Password" type="password" />
          <Input placeholder="Disabled" disabled />
        </CardContent>
      </Card>

      {/* Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle>Card Example</CardTitle>
          <CardDescription>Exemplu de card cu header, content și footer</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Acesta este conținutul card-ului. Poate conține orice tip de content.
          </p>
        </CardContent>
        <CardFooter>
          <Button>Action Button</Button>
        </CardFooter>
      </Card>

      {/* Dialog Section */}
      <Card>
        <CardHeader>
          <CardTitle>Dialog</CardTitle>
          <CardDescription>Modal dialog cu overlay</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Deschide Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Titlu Dialog</DialogTitle>
                <DialogDescription>
                  Aceasta este descrierea dialog-ului. Poate conține informații importante.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p>Conținutul dialog-ului poate fi orice component React.</p>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <CardTitle>Table</CardTitle>
          <CardDescription>Tabel cu date</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Lista de utilizatori demo</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Nume</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acțiuni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Ion Popescu</TableCell>
                <TableCell>ion@example.com</TableCell>
                <TableCell>Activ</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Editează</Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Maria Ionescu</TableCell>
                <TableCell>maria@example.com</TableCell>
                <TableCell>Activ</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Editează</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tabs</CardTitle>
          <CardDescription>Navigation cu tab-uri</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Cont</TabsTrigger>
              <TabsTrigger value="password">Parolă</TabsTrigger>
              <TabsTrigger value="settings">Setări</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="space-y-4">
              <p>Conținut tab Cont</p>
            </TabsContent>
            <TabsContent value="password" className="space-y-4">
              <p>Conținut tab Parolă</p>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <p>Conținut tab Setări</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>Bară de progres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">25%</p>
            <Progress value={25} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">50%</p>
            <Progress value={50} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">75%</p>
            <Progress value={75} />
          </div>
        </CardContent>
      </Card>

      {/* Select Section */}
      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
          <CardDescription>Dropdown select</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selectează o opțiune" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="option1">Opțiunea 1</SelectItem>
              <SelectItem value="option2">Opțiunea 2</SelectItem>
              <SelectItem value="option3">Opțiunea 3</SelectItem>
              <SelectItem value="option4">Opțiunea 4</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Theme Toggle Section */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Toggle</CardTitle>
          <CardDescription>Comutare între tema light și dark</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <p>Click pe iconița din header pentru a schimba tema:</p>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-muted-foreground py-8">
        <p>✅ Task 1.1 UI Component Library - Completat cu succes</p>
        <p className="text-sm mt-2">
          Toate componentele shadcn/ui sunt instalate și funcționale.
        </p>
      </div>
    </div>
  );
}
