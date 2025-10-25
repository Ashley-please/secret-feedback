import { useMemo, useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

export function useSigner() {
  const { data: walletClient } = useWalletClient();
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);

  useEffect(() => {
    async function getSigner() {
      if (!walletClient) {
        setSigner(null);
        return;
      }
      
      const { account, chain, transport } = walletClient;
      const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
      };
      
      const provider = new BrowserProvider(transport as any, network);
      const ethSigner = await provider.getSigner(account.address);
      
      setSigner(ethSigner);
    }
    
    getSigner();
  }, [walletClient]);

  return signer;
}
