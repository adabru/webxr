async function refresh(file) {
  console.log('refresh')
  let shouldRefresh = await (await fetch('/refresh')).text()
  if (shouldRefresh == 'true') window.location.reload()
}
setInterval(refresh, 1000)

AFRAME.registerComponent('gallery', {
  init: async function () {
    const images = await (await fetch('/images')).json()
    console.log(images)
    for (const [name, w, h] of images) {
      var element = document.createElement('a-plane')
      element.setAttribute('position', '0 1.5 -1')
      element.setAttribute('src', 'images/' + name)
      element.setAttribute('width', w / 1500.0)
      element.setAttribute('height', h / 1500.0)
      element.setAttribute('geometry', 'primitive: plane')
      element.setAttribute('grabbable', '')
      element.setAttribute('stretchable', '')
      this.el.appendChild(element)
    }
  },
})
