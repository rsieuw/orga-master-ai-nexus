import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card';

describe('Card', () => {
  it('rendert een Card component', () => {
    renderWithProviders(<Card>Card inhoud</Card>);
    expect(screen.getByText('Card inhoud')).toBeInTheDocument();
  });

  it('past de juiste klassen toe op de Card', () => {
    renderWithProviders(<Card data-testid="test-card">Card inhoud</Card>);
    const card = screen.getByTestId('test-card');
    expect(card).toHaveClass('rounded-xl');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('bg-card/80');
  });

  it('accepteert een aangepaste className voor Card', () => {
    renderWithProviders(<Card className="custom-class" data-testid="test-card">Card inhoud</Card>);
    const card = screen.getByTestId('test-card');
    expect(card).toHaveClass('custom-class');
  });
});

describe('CardHeader', () => {
  it('rendert een CardHeader component', () => {
    renderWithProviders(<CardHeader>Header inhoud</CardHeader>);
    expect(screen.getByText('Header inhoud')).toBeInTheDocument();
  });
  
  it('past de juiste klassen toe op de CardHeader', () => {
    renderWithProviders(<CardHeader data-testid="test-header">Header inhoud</CardHeader>);
    const header = screen.getByTestId('test-header');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('flex-col');
    expect(header).toHaveClass('p-6');
  });
});

describe('CardTitle', () => {
  it('rendert een CardTitle component', () => {
    renderWithProviders(<CardTitle>Titel</CardTitle>);
    expect(screen.getByText('Titel')).toBeInTheDocument();
  });
  
  it('rendert als een h3 element', () => {
    renderWithProviders(<CardTitle>Titel</CardTitle>);
    const title = screen.getByText('Titel');
    expect(title.tagName).toBe('H3');
  });
});

describe('CardDescription', () => {
  it('rendert een CardDescription component', () => {
    renderWithProviders(<CardDescription>Beschrijving</CardDescription>);
    expect(screen.getByText('Beschrijving')).toBeInTheDocument();
  });
  
  it('past de juiste klassen toe op de CardDescription', () => {
    renderWithProviders(<CardDescription data-testid="test-desc">Beschrijving</CardDescription>);
    const desc = screen.getByTestId('test-desc');
    expect(desc).toHaveClass('text-sm');
    expect(desc).toHaveClass('text-muted-foreground');
  });
});

describe('CardContent', () => {
  it('rendert een CardContent component', () => {
    renderWithProviders(<CardContent>Content inhoud</CardContent>);
    expect(screen.getByText('Content inhoud')).toBeInTheDocument();
  });
  
  it('past de juiste klassen toe op de CardContent', () => {
    renderWithProviders(<CardContent data-testid="test-content">Content inhoud</CardContent>);
    const content = screen.getByTestId('test-content');
    expect(content).toHaveClass('p-6');
    expect(content).toHaveClass('pt-0');
  });
});

describe('CardFooter', () => {
  it('rendert een CardFooter component', () => {
    renderWithProviders(<CardFooter>Footer inhoud</CardFooter>);
    expect(screen.getByText('Footer inhoud')).toBeInTheDocument();
  });
  
  it('past de juiste klassen toe op de CardFooter', () => {
    renderWithProviders(<CardFooter data-testid="test-footer">Footer inhoud</CardFooter>);
    const footer = screen.getByTestId('test-footer');
    expect(footer).toHaveClass('flex');
    expect(footer).toHaveClass('items-center');
    expect(footer).toHaveClass('p-6');
    expect(footer).toHaveClass('pt-0');
  });
});

describe('Card samenstellingen', () => {
  it('rendert een volledige Card met alle subcomponenten', () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Voorbeeld Kaart</CardTitle>
          <CardDescription>Dit is een voorbeeldkaart</CardDescription>
        </CardHeader>
        <CardContent>Hier staat de inhoud van de kaart</CardContent>
        <CardFooter>Voetgedeelte van de kaart</CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Voorbeeld Kaart')).toBeInTheDocument();
    expect(screen.getByText('Dit is een voorbeeldkaart')).toBeInTheDocument();
    expect(screen.getByText('Hier staat de inhoud van de kaart')).toBeInTheDocument();
    expect(screen.getByText('Voetgedeelte van de kaart')).toBeInTheDocument();
  });
}); 