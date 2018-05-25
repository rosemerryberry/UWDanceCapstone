import React, { Component } from 'react';
import ReactAvatarEditor from 'react-avatar-editor'
import Dropzone from 'react-dropzone'
import "./styling/General.css"
import "./styling/AvatarEditorConsole.css"

class AvatarEditorConsole extends Component {
  state = {
    image: this.props.img,
    allowZoomOut: false,
    position: { x: 0.5, y: 0.5 },
    scale: 1,
    rotate: 0,
    borderRadius: 0,
    preview: null,
    width: 200,
    height: 200,
  }

  dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  sendUpImage = () => {
    let edit = this.editor.getImageScaledToCanvas().toDataURL()
    let image = this.dataURLtoFile(edit, 'a.png');
    this.props.changeImg(image)
  }

  handleNewImage = e => {
    this.setState({ image: e.target.files[0] })
    this.sendUpImage()
  }

  handleSave = data => {
    const img = this.editor.getImageScaledToCanvas().toDataURL()

    this.setState({
      preview: {
        img,
        width: this.state.width,
        height: this.state.height,
        borderRadius: this.state.borderRadius,
      },
    })

    this.sendUpImage()
  }

  handleScale = e => {
    const scale = parseFloat(e.target.value)
    this.setState({ scale })
    this.sendUpImage()
  }

  rotateLeft = e => {
    e.preventDefault()

    this.setState({
      rotate: this.state.rotate - 90,
    })
    this.sendUpImage()
  }

  rotateRight = e => {
    e.preventDefault()
    this.setState({
      rotate: this.state.rotate + 90,
    })
    this.sendUpImage()
  }

  setEditorRef = editor => {
    if (editor) this.editor = editor
  }

  handlePositionChange = position => {
    this.setState({ position })
    this.sendUpImage()
  }

  handleDrop = acceptedFiles => {
    this.setState({ image: acceptedFiles[0] })
    this.sendUpImage()
  }

  render() {
    return (
      <div>
        <div className="photoContainer">
        <Dropzone
          onDrop={this.handleDrop}
          disableClick
          multiple={false}
          style={{ width: this.state.width, height: this.state.height, marginBottom: '35px' }}
        >
          <div>
            <ReactAvatarEditor
              ref={this.setEditorRef}
              scale={parseFloat(this.state.scale)}
              width={this.state.width}
              height={this.state.height}
              position={this.state.position}
              onPositionChange={this.handlePositionChange}
              rotate={parseFloat(this.state.rotate)}
              borderRadius={this.state.borderRadius}
              onSave={this.handleSave}
              image={this.state.image}
            />
          </div>
        </Dropzone>
        </div>
        <div className="nameWrap">
        <br />
        <p>New File:</p>
        <input name="newImage" type="file" onChange={this.handleNewImage} />
        <br />
        <p>Zoom:</p>
        <input
          name="scale"
          type="range"
          onChange={this.handleScale}
          min={this.state.allowZoomOut ? '0.1' : '1'}
          max="2"
          step="0.01"
          defaultValue="1"
        />
        <br />

        <p>Rotate: &nbsp; 
        <button onClick={this.rotateLeft}>Left</button>
        <button onClick={this.rotateRight}>Right</button>
        </p>
        </div>
        {/* <br />
        <br />
        <input type="button" onClick={this.handleSave} value="Preview" />
        <br />
        {!!this.state.preview && (
          <img
            alt="preview"
            src={this.state.preview.img}
            style={{
              borderRadius: `${(Math.min(
                this.state.preview.height,
                this.state.preview.width
              ) +
                10) *
                (this.state.preview.borderRadius / 2 / 100)}px`,
            }}
          />
        )} */}
      </div>
    )
  }
}

export default AvatarEditorConsole;
