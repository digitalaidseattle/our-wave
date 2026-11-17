import { useState } from 'react';
import { Dialog } from '@mui/material';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GrantInfoEditor } from './GrantInfoEditor';
import { GrantOutputEditor } from './GrantOutputEditor';
import { GrantContextEditor } from './GrantContextEditor';
import { GrantRecipeContext } from '../../components/GrantRecipeContext';
import type { GrantRecipe } from '../../types';

const mocks = vi.hoisted(() => ({ countTokens: vi.fn() }));
vi.mock('@digitalaidseattle/core', () => ({
  useHelp: () => ({ setShowHelp: vi.fn() }),
  useNotifications: () => ({ error: vi.fn() }),
}));
vi.mock('../../services/Configuration', () => ({
  Configuration: { getInstance: () => ({ aiService: { calcTokenCount: mocks.countTokens } }) },
}));

const initialRecipe: GrantRecipe = {
  id: 'recipe-1', description: 'First recipe', template: '', prompt: '',
  createdAt: new Date(), updatedAt: new Date(), createdBy: '', updatedBy: '',
  lastSubmitted: null, rating: 0, tags: [], modelType: 'test-model', tokenCount: 0,
  contexts: [{ type: 'text', name: null, value: 'First context' },
    { type: 'text', name: null, value: 'Second context' }],
  outputsWithWordCount: [{ name: 'Summary', maxWords: 500, unit: 'words' },
    { name: 'Impact', maxWords: 200, unit: 'words' }],
  inputParameters: [],
};

function Form({ editor }: { editor: 'info' | 'outputs' | 'contexts' }) {
  const [recipe, setRecipe] = useState(initialRecipe);
  return <GrantRecipeContext.Provider value={{ recipe, setRecipe }}>
    {editor === 'info' && <GrantInfoEditor recipe={recipe} onChange={setRecipe} />}
    {editor === 'outputs' && <GrantOutputEditor fields={recipe.outputsWithWordCount}
      onChange={fields => setRecipe({ ...recipe, outputsWithWordCount: fields })} />}
    {editor === 'contexts' && <GrantContextEditor onChange={setRecipe} />}
    <output data-testid="recipe">{JSON.stringify(recipe)}</output>
  </GrantRecipeContext.Provider>;
}

function currentRecipe(): GrantRecipe {
  return JSON.parse(screen.getByTestId('recipe').textContent!);
}

afterEach(cleanup);
beforeEach(() => { mocks.countTokens.mockReset(); mocks.countTokens.mockResolvedValue(7); });

describe('uncontrolled recipe editors', () => {
  it('broadcasts title edits before blur and preserves a cursor in the middle of the text', () => {
    render(<Form editor="info" />);
    const input = screen.getByPlaceholderText('Name your recipe') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'First new recipe', selectionStart: 9, selectionEnd: 9 } });
    expect(currentRecipe().description).toBe('First new recipe');
    expect(input.selectionStart).toBe(9);
    expect(screen.getByPlaceholderText('Name your recipe')).toBe(input);
  });

  it('broadcasts multiline context edits without resetting the selection', () => {
    render(<Form editor="contexts" />);
    const input = screen.getAllByPlaceholderText('Enter context information here')[0] as HTMLTextAreaElement;
    fireEvent.change(input, { target: { value: 'First\nnew context', selectionStart: 9, selectionEnd: 9 } });
    expect(currentRecipe().contexts[0].value).toBe('First\nnew context');
    expect(input.selectionStart).toBe(9);
    expect(mocks.countTokens).not.toHaveBeenCalled();
  });

  it('keeps a cleared numeric field empty while updating form data', () => {
    render(<Form editor="outputs" />);
    const input = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(input.value).toBe('');
    expect(currentRecipe().outputsWithWordCount[0].maxWords).toBe(0);
  });

  it('keeps output DOM values aligned after removing the first row', () => {
    render(<Form editor="outputs" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'remove output field' })[0]);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('Impact');
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('200');
    expect(currentRecipe().outputsWithWordCount).toHaveLength(1);
  });

  it('keeps context DOM values aligned after removing the first row', () => {
    render(<Form editor="contexts" />);
    fireEvent.click(screen.getAllByRole('button', { name: 'remove context' })[0]);
    expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Second context');
    expect(currentRecipe().contexts).toHaveLength(1);
  });

  it('ignores a token count that arrives after further typing', async () => {
    let resolveCount!: (value: number) => void;
    mocks.countTokens.mockReturnValue(new Promise<number>(resolve => { resolveCount = resolve; }));
    render(<Form editor="contexts" />);
    const input = screen.getAllByRole('textbox')[0];
    fireEvent.change(input, { target: { value: 'Count this' } });
    fireEvent.blur(input);
    fireEvent.change(input, { target: { value: 'Newer text' } });
    await act(async () => { resolveCount(10); });
    expect(currentRecipe().contexts[0].value).toBe('Newer text');
    expect(currentRecipe().contexts[0].tokenCount).toBeUndefined();
  });

  it('merges a token count without overwriting edits to another context', async () => {
    let resolveCount!: (value: number) => void;
    mocks.countTokens.mockReturnValue(new Promise<number>(resolve => { resolveCount = resolve; }));
    render(<Form editor="contexts" />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.blur(inputs[0]);
    fireEvent.change(inputs[1], { target: { value: 'Other edit' } });
    await act(async () => { resolveCount(10); });
    expect(currentRecipe().contexts[0].tokenCount).toBe(10);
    expect(currentRecipe().contexts[1].value).toBe('Other edit');
  });

  it('discards a token count after an editing session unmounts', async () => {
    let resolveCount!: (value: number) => void;
    mocks.countTokens.mockReturnValue(new Promise<number>(resolve => { resolveCount = resolve; }));
    const onChange = vi.fn();
    const { unmount } = render(
      <GrantRecipeContext.Provider value={{ recipe: initialRecipe, setRecipe: vi.fn() }}>
        <GrantContextEditor onChange={onChange} />
      </GrantRecipeContext.Provider>
    );
    fireEvent.blur(screen.getAllByRole('textbox')[0]);
    unmount();
    await act(async () => { resolveCount(10); });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reinitializes a reused, mounted dialog when its editing session key changes', () => {
    const onChange = vi.fn();
    const dialog = (open: boolean, session: number, recipe = initialRecipe) =>
      <Dialog open={open} keepMounted>
        <GrantInfoEditor key={session} recipe={recipe} onChange={onChange} />
      </Dialog>;
    const { rerender } = render(dialog(true, 1));
    fireEvent.change(screen.getByPlaceholderText('Name your recipe'), { target: { value: 'Unsaved edit' } });
    rerender(dialog(false, 1));
    rerender(dialog(true, 2));
    expect((screen.getByPlaceholderText('Name your recipe') as HTMLInputElement).value).toBe('First recipe');
    rerender(dialog(true, 3, { ...initialRecipe, description: 'Different recipe' }));
    expect((screen.getByPlaceholderText('Name your recipe') as HTMLInputElement).value).toBe('Different recipe');
  });
});
