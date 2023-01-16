export default function createUtils(){
    const utils = {};

    utils.estaEntre = (valor, minimo, maximo) => {
        if (isNaN(valor)) {
            return console.error(`Valor ${valor} inválido.`);
          }
      
          if (isNaN(minimo)) {
            return console.error(`Valor ${minimo} inválido.`);
          }
      
          if (isNaN(maximo)) {
            return console.error(`Valor ${maximo} inválido.`);
          }
      
          return valor >= minimo && valor <= maximo;
    };
    
    return utils;
}