import {describe, it, expect} from 'vitest';
import {render, screen, fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {DescriptionEditor} from '@/components/forms/DescriptionEditor';
import {editorToMarkdown, markdownToEditorHtml} from '@/components/forms/description-editor-markdown';
import fr from '@/messages/fr.json';

const view = (defaultValue = '') => render(
  <NextIntlClientProvider locale="fr" messages={fr}>
    <DescriptionEditor defaultValue={defaultValue}/>
  </NextIntlClientProvider>
);

function backing(container: HTMLElement) {
  return container.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
}

function selectText(editor: HTMLElement, text: string) {
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const start = node.textContent?.indexOf(text) ?? -1;
    if (start < 0) continue;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, start + text.length);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    fireEvent.mouseUp(editor);
    return;
  }
  throw new Error(`Texte introuvable: ${text}`);
}

describe('éditeur visuel de description', () => {
  it('distingue visuellement le format actif et le désactive au second clic', () => {
    let bold = false;
    const stateDescriptor = Object.getOwnPropertyDescriptor(document, 'queryCommandState');
    const commandDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');
    Object.defineProperty(document, 'queryCommandState', {configurable: true, value: (command: string) => command === 'bold' && bold});
    Object.defineProperty(document, 'execCommand', {configurable: true, value: () => {bold = !bold; return true;}});
    try {
      view('Bienvenue');
      const editor = screen.getByRole('textbox', {name: fr.descriptionEditor.editorLabel});
      const button = screen.getByRole('button', {name: fr.descriptionEditor.bold});
      selectText(editor, 'Bienvenue');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveClass('bg-soul-violet', 'text-white');
      fireEvent.input(editor);
      expect(button).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(button);
      expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(button).toHaveClass('bg-white');
      expect(button).not.toHaveClass('bg-soul-violet');
    } finally {
      if (stateDescriptor) Object.defineProperty(document, 'queryCommandState', stateDescriptor);
      else Reflect.deleteProperty(document, 'queryCommandState');
      if (commandDescriptor) Object.defineProperty(document, 'execCommand', commandDescriptor);
      else Reflect.deleteProperty(document, 'execCommand');
    }
  });

  it('affiche le formatage sans marqueurs Markdown et sans bouton aperçu', () => {
    const {container} = view('**Important** et *doux*');
    const editor = screen.getByRole('textbox', {name: fr.descriptionEditor.editorLabel});
    expect(editor).toHaveTextContent('Important et doux');
    expect(editor.innerHTML).toContain('<strong>Important</strong>');
    expect(editor).not.toHaveTextContent('**');
    expect(screen.queryByRole('button', {name: fr.descriptionEditor.preview})).not.toBeInTheDocument();
    expect(backing(container)).toHaveValue('**Important** et *doux*');
  });

  it('applique gras, italique, souligné, liste et emoji en conservant le Markdown du formulaire', () => {
    const {container} = view('Important');
    const editor = screen.getByRole('textbox', {name: fr.descriptionEditor.editorLabel});
    selectText(editor, 'Important');
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.bold}));
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.italic}));
    expect(editor.innerHTML).toContain('<strong><em>Important</em></strong>');
    expect(backing(container)).toHaveValue('***Important***');

    selectText(editor, 'Important');
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.underline}));
    expect(backing(container).value).toContain('__Important__');

    selectText(editor, 'Important');
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.list}));
    expect(backing(container).value).toMatch(/^- /);

    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.emoji}));
    fireEvent.click(screen.getByRole('button', {name: '😊'}));
    expect(backing(container).value).toContain('😊');
  });

  it('valide les liens et préserve la sélection pendant l’utilisation du panneau', () => {
    const {container} = view('Inscription au cours');
    const editor = screen.getByRole('textbox', {name: fr.descriptionEditor.editorLabel});
    selectText(editor, 'Inscription');
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.link}));
    fireEvent.change(screen.getByLabelText(fr.descriptionEditor.linkAddress), {target: {value: 'javascript:alert(1)'}});
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.insertLink}));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(backing(container)).toHaveValue('Inscription au cours');

    fireEvent.change(screen.getByLabelText(fr.descriptionEditor.linkAddress), {target: {value: 'example.ch/form(a)'}});
    fireEvent.click(screen.getByRole('button', {name: fr.descriptionEditor.insertLink}));
    expect(backing(container)).toHaveValue('[Inscription](https://example.ch/form%28a%29) au cours');
    expect(editor.querySelector('a')).toHaveAttribute('href', 'https://example.ch/form(a)');
  });

  it('refuse le HTML collé et revient à la dernière valeur valide au-delà de 8 000 caractères', () => {
    const {container} = view('Texte sûr');
    const editor = screen.getByRole('textbox', {name: fr.descriptionEditor.editorLabel});
    fireEvent.paste(editor, {clipboardData: {getData: () => '<img src=x onerror=alert(1)>'}});
    expect(editor.querySelector('img')).toBeNull();
    expect(backing(container).value).toContain('<img src=x onerror=alert(1)>');

    editor.textContent = 'a'.repeat(8001);
    fireEvent.input(editor);
    expect(screen.getByRole('alert')).toHaveTextContent(fr.descriptionEditor.tooLong);
    expect(backing(container).value.length).toBeLessThanOrEqual(8000);
  });
});

describe('conversion sûre de l’éditeur', () => {
  it('neutralise le HTML et les protocoles non web à l’ouverture', () => {
    const html = markdownToEditorHtml('<script>alert(1)</script> [piège](javascript:alert)');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<a');
  });

  it('ignore les balises inconnues lors de la sérialisation', () => {
    const editor = document.createElement('div');
    editor.innerHTML = '<strong>Sûr</strong><img src=x onerror=alert(1)><u>texte</u>';
    expect(editorToMarkdown(editor)).toBe('**Sûr**__texte__');
  });
});
