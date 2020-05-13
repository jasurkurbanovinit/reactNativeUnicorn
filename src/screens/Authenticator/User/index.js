import React, { useState, useEffect } from 'react'
import { Auth, Storage, API, graphqlOperation } from 'aws-amplify'
import * as Keychain from 'react-native-keychain'
import { TouchableOpacity, Image } from 'react-native'
import { AppContainer, Button } from 'react-native-unicorn-uikit'
import v4 from 'react-native-uuid'
import ImagePicker from 'react-native-image-crop-picker'
import { createUser as CreateUser } from '../../../graphql/mutations'
import { goHome } from '../../../constants'
import config from '../../../../aws-exports'

const {
  aws_user_files_s3_bucket_region: region,
  aws_user_files_s3_bucket: bucket
} = config


const img = {
  width: 100,
  height: 100,
  resizeMode: 'contain',
  borderRadius: 50,
  alignSelf: 'center',
  margin: 50
}

const User = ({ navigation }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ava, setAva] = useState({})

  useEffect(() => {
    const checkUser = async () => {
      await Auth.currentAuthenticatedUser()
    }
    checkUser()
  })

  // upload the image to S3 and then save it in the GraphQL API
  const createUser = async (path, filename, mime) => {
    console.log('File found')
    const username = Auth.user.attributes.sub
    const key = `${v4()}-${filename}`
    const fileForUpload = {
      bucket,
      key,
      region
    }
    const inputData = {
      username,
      avatar: fileForUpload
    }

    try {
      const response = await fetch(path)
      const blob = await response.blob()

      await Storage.put(key, blob, {
        contentType: mime
      })
      await API.graphql(graphqlOperation(CreateUser, { input: inputData }))
      console.log('successfully stored user data!')
    } catch (err) {
      console.log(err)
    }
  }

  const pickAva = async (cropping = true, circular = true) => {
    try {
      const image = await ImagePicker.openPicker({
        width: 500,
        height: 500,
        cropping,
        cropperCircleOverlay: circular,
        compressImageMaxWidth: 1000,
        compressImageMaxHeight: 1000,
        compressImageQuality: 1,
        compressVideoPreset: 'MediumQuality',
        includeExif: true
      })
      const { filename, path, width, height, mime } = image
      setAva({ uri: path, width, height, mime })
      createUser(path, filename, mime)
      console.log('Success')
    } catch (e) {
      console.log('e', e) // eslint-disable-line
    }
  }

  const _onPress = async () => {
    setLoading(true)
    try {
      await Auth.signOut()
      await Keychain.resetInternetCredentials('auth')
      goHome(navigation)()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <AppContainer message={error} loading={loading}>
      <TouchableOpacity style={touch} onPress={() => setAva({ uri: null })}>
        <Image style={img} source={ava} />
      </TouchableOpacity>

      <Button title="Avatar" onPress={() => pickAva()} />
      <Button title="Sign Out" onPress={_onPress} />
    </AppContainer>
  )
}

export { User }
