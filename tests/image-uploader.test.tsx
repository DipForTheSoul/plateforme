import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {expect,it,vi} from 'vitest';
import {ImageUploader} from '@/components/forms/ImageUploader';
import fr from '@/messages/fr.json';
const mocks=vi.hoisted(()=>({upload:vi.fn()}));
vi.mock('@/lib/image',()=>({uploadImage:mocks.upload}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>({auth:{getUser:async()=>({data:{user:{id:'test'}}})}})}));
it('capture les fichiers avant le reset de l’input et conserve les photos réussies si la suivante échoue',async()=>{
  mocks.upload.mockResolvedValueOnce('https://example.test/photo.webp').mockRejectedValueOnce(new Error('Photo trop volumineuse'));
  const onChange=vi.fn(),busy=vi.fn();
  render(<NextIntlClientProvider locale="fr" messages={fr}><ImageUploader prefix="test" images={[]} onChange={onChange} onBusyChange={busy}/></NextIntlClientProvider>);
  const files=[new File(['one'],'one.jpg',{type:'image/jpeg'}),new File(['two'],'two.jpg',{type:'image/jpeg'})];
  const liveFiles=[...files];
  fireEvent.change(screen.getByLabelText(fr.uploader.maxSizeHint),{target:{files:liveFiles}});
  liveFiles.splice(0); // Native FileList loses its entries on input.value=''.
  await screen.findByRole('alert');
  await waitFor(()=>expect(mocks.upload).toHaveBeenCalledTimes(2));
  expect(onChange).toHaveBeenCalledWith(['https://example.test/photo.webp']);
  expect(busy).toHaveBeenLastCalledWith(false);
});
