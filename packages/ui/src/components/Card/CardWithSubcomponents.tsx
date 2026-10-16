import { Card as BaseCard } from "./Card";
import { CardHeader } from "./CardHeader";
import { CardBody } from "./CardBody";
import { CardFooter } from "./CardFooter";

export const CardWithSubcomponents = Object.assign(BaseCard, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});
