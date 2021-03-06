import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  });

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    }
  }, [cartPreviousValue, cart]);

  const addProduct = async (productId: number) => {
    try {
      const newCart = [...cart];
      const productExists = newCart.find((product) => product.id === productId);

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists?.amount + 1 : 0;

      if (currentAmount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = currentAmount;
      } else {
        const product = await api.get<Product>(`/products/${productId}`);

        newCart.push({ ...product.data, amount: 1 });
      }
      setCart(newCart);
    } catch {
      toast.error("Erro na adi????o do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart];
      const productExists = newCart.find((product) => product.id === productId);

      if (productExists) {
        newCart.splice(newCart.indexOf(productExists));
      } else {
        toast.error("Erro na remo????o do produto");
        return;
      }
      setCart(newCart);
    } catch {
      toast.error("Erro na remo????o do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      debugger;
      if (amount <= 0) {
        return;
      }

      const newCart = [...cart];
      const productExists = newCart.find((product) => product.id === productId);

      const stock = await api.get<Stock>(`/stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? amount : 0;

      if (currentAmount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (productExists) {
        productExists.amount = currentAmount;
      }

      setCart(newCart);
    } catch {
      toast.error("Erro na altera????o de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
