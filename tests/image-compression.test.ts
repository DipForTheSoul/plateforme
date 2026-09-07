import {expect,it,vi} from 'vitest';
import {compressImage} from '@/lib/image';
it('refuse une photo de plus de 10 Mo avant décodage',async()=>{
  const file=new File([new Uint8Array(10*1024*1024+1)],'large.jpg',{type:'image/jpeg'});
  await expect(compressImage(file)).rejects.toThrow('10 Mo');
});
it('refuse un format non pris en charge',async()=>{
  await expect(compressImage(new File(['data'],'photo.heic',{type:'image/heic'}))).rejects.toThrow('JPEG');
});
it('rend une erreur compréhensible pour un fichier illisible',async()=>{
  vi.stubGlobal('createImageBitmap',vi.fn().mockRejectedValue(new Error('InvalidStateError')));
  await expect(compressImage(new File(['bad'],'bad.jpg',{type:'image/jpeg'}))).rejects.toThrow('illisible');
});
