import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

test('renders app title', () => {
  render(<App />);
  const heading = screen.getByText(/Smart Invo/i);
  expect(heading).toBeInTheDocument();
});

test('navigates to about page via help link', () => {
  render(<App />);
  const helpButton = screen.getByText(/click here/i);
  fireEvent.click(helpButton);
  const aboutHeading = screen.getByText(/About SmartInvo/i);
  expect(aboutHeading).toBeInTheDocument();
});
