import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';
import { MemoryRouter } from 'react-router-dom';

// Helper function to render with MemoryRouter
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Footer', () => {
  it('should render the copyright notice with the current year', () => {
    renderWithRouter(<Footer />);
    const currentYear = new Date().getFullYear();
    // Corrected regex for Dutch text
    const copyrightRegex = new RegExp(`© ${currentYear} OrgaMaster AI. Alle rechten voorbehouden.`, 'i');
    expect(screen.getByText(copyrightRegex)).toBeInTheDocument();
  });

  // Example for testing a link within the footer
  it('should render links correctly', () => {
    renderWithRouter(<Footer />);
    // Add expectations for specific links if they exist
    // For example, if there's a link to the homepage:
    // expect(screen.getByRole('link', { name: /orgamaster ai/i })).toHaveAttribute('href', '/');
  });

  // Add more tests if the footer has links, other sections, etc.
  // Example:
  // it('should render the privacy policy link', () => {
  //   render(<Footer />);
  //   expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
  // });
}); 