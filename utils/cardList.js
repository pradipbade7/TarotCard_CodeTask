
const modules = import.meta.glob('../src/assets/cards/*.png', { eager: true })

export const cardMap = Object.entries(modules).reduce((map, [path, module]) => {
  const file = path.split('/').pop()           
  const code = file.replace(/\.png$/, '')      
  map[code] = module.default                     
  return map
}, {})

export const cardCodes = Object.keys(cardMap).filter((c) => c !== 'CardBacks')
console.log(cardCodes)
