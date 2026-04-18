import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import os, glob
import librosa
import librosa.display


sample_rate=48000

def get_waveforms(file):
    '''# load an individual sample audio file
    # read the full 3 seconds of the file, cut off the first 0.5s of silence; native sample rate = 48k
    # don't need to store the sample rate that librosa.load returns'''

    waveform, _ = librosa.load(file, duration=3, offset=0.5, sr=sample_rate)
    waveform_homo = np.zeros((int(sample_rate*3,)))
    waveform_homo[:len(waveform)] = waveform
    return waveform_homo

class SER(nn.Module):
    # Define all layers present in the network
    def __init__(self,num_emotions):
        super().__init__()

        '''################ TRANSFORMER BLOCK #############################'''
        self.transformer_maxpool = nn.MaxPool2d(kernel_size=[1,4], stride=[1,4])
        transformer_layer = nn.TransformerEncoderLayer(
            d_model=40, # input feature (frequency) dim after maxpooling 40*282 -> 40*70 (MFC*time)
            nhead=4, # 4 self-attention layers in each multi-head self-attention layer in each encoder block
            dim_feedforward=512, # 2 linear layers in each encoder block's feedforward network: dim 40-->512--->40
            dropout=0.4,
            activation='relu' # ReLU: avoid saturation/tame gradient/reduce compute time
        )
        self.transformer_encoder = nn.TransformerEncoder(transformer_layer, num_layers=4)

        '''############### 1ST PARALLEL 2D CONVOLUTION BLOCK ############'''
        self.conv2Dblock1 = nn.Sequential(

            nn.Conv2d(
                in_channels=1, # input volume depth == input channel dim == 1
                out_channels=16, # expand output feature map volume's depth to 16
                kernel_size=3, # 3*3 stride 1 kernel
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(16), # batch normalize the output feature map before activation
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=2, stride=2),
            nn.Dropout(p=0.3),

            # 2nd 2D convolution layer identical to last except output dim, maxpool kernel
            nn.Conv2d(
                in_channels=16,
                out_channels=32, # expand output feature map volume's depth to 32
                kernel_size=3,
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=4, stride=4), # increase maxpool kernel for subsequent filters
            nn.Dropout(p=0.3),

            # 3rd 2D convolution layer identical to last except output dim
            nn.Conv2d(
                in_channels=32,
                out_channels=64, # expand output feature map volume's depth to 64
                kernel_size=3,
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=4, stride=4),
            nn.Dropout(p=0.3),
        )
        '''############### 2ND PARALLEL 2D CONVOLUTION BLOCK ############'''
        self.conv2Dblock2 = nn.Sequential(

            # 1st 2D convolution layer
            nn.Conv2d(
                in_channels=1, # input volume depth == input channel dim == 1
                out_channels=16,
                kernel_size=3, #3*3 stride 1 kernel
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(16), # batch normalize the output feature map before activation
            nn.ReLU(), # feature map --> activation map
            nn.MaxPool2d(kernel_size=2, stride=2), #typical maxpool kernel size
            nn.Dropout(p=0.3), #randomly zero 30% of 1st layer's output feature map in training

            # 2nd 2D convolution layer identical to last except output dim, maxpool kernel
            nn.Conv2d(
                in_channels=16,
                out_channels=32, # expand output feature map volume's depth to 32
                kernel_size=3,
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=4, stride=4), # increase maxpool kernel for subsequent filters
            nn.Dropout(p=0.3),

            # 3rd 2D convolution layer identical to last except output dim
            nn.Conv2d(
                in_channels=32,
                out_channels=64, # expand output feature map volume's depth to 64
                kernel_size=3,
                stride=1,
                padding=1
                      ),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=4, stride=4),
            nn.Dropout(p=0.3),
        )

        # Each full convolution block outputs (64*1*8) embedding flattened to dim 512 1D array
        # Full transformer block outputs 40*70 feature map, which we time-avg to dim 40 1D array
        # 512*2+40 == 1064 input features --> 8 output emotions
        self.fc1_linear = nn.Linear(512*2+40,num_emotions)

        self.softmax_out = nn.Softmax(dim=1)

    def forward(self,x):

        '''############ 1st parallel Conv2D block: 4 Convolutional layers ############################'''
        conv2d_embedding1 = self.conv2Dblock1(x) # x == N/batch * channel * freq * time

        # flatten final 64*1*8 feature map from convolutional layers to length 512 1D array
        conv2d_embedding1 = torch.flatten(conv2d_embedding1, start_dim=1)

        '''############ 2nd parallel Conv2D block: 4 Convolutional layers #############################'''
        conv2d_embedding2 = self.conv2Dblock2(x) # x == N/batch * channel * freq * time

        conv2d_embedding2 = torch.flatten(conv2d_embedding2, start_dim=1)


        x_maxpool = self.transformer_maxpool(x)

        # remove channel dim: 1*40*70 --> 40*70
        x_maxpool_reduced = torch.squeeze(x_maxpool,1)

        # transformer encoder layer requires tensor in format: time * batch * embedding (freq)
        x = x_maxpool_reduced.permute(2,0,1)

        # finally, pass reduced input feature map x into transformer encoder layers
        transformer_output = self.transformer_encoder(x)

        transformer_embedding = torch.mean(transformer_output, dim=0) # dim 40x70 --> 40

        # concatenate embedding tensors output by parallel 2*conv and 1*transformer blocks
        complete_embedding = torch.cat([conv2d_embedding1, conv2d_embedding2,transformer_embedding], dim=1)

        output_logits = self.fc1_linear(complete_embedding)

        output_softmax = self.softmax_out(output_logits)

        return output_logits, output_softmax
emotions_dict ={
    '0':'surprised',
    '1':'neutral',
    '2':'calm',
    '3':'happy',
    '4':'sad',
    '5':'angry',
    '6':'fearful',
    '7':'disgust'
}
cz

def load_checkpoint(optimizer, model, filename):
    checkpoint_dict = torch.load(filename,map_location=torch.device('cpu'))
    epoch = checkpoint_dict['epoch']
    model.load_state_dict(checkpoint_dict['model'])
    if optimizer is not None:
        optimizer.load_state_dict(checkpoint_dict['optimizer'])
    return epoch

def make_validate_fnc(model,criterion):
    def validate(X,Y):

        with torch.no_grad():

            # set model to validation phase i.e. turn off dropout and batchnorm layers
            model.eval()

            # get the model's predictions on the validation set
            output_logits, output_softmax = model(X)
            predictions = torch.argmax(output_softmax,dim=1)

            # calculate the mean accuracy over the entire validation set
            accuracy = torch.sum(Y==predictions)/float(len(Y))

            # compute error from logits (nn.crossentropy implements softmax)
            loss = criterion(output_logits,Y)

        return loss.item(), accuracy*100, predictions
    return validate

model = SER(len(emotions_dict))
optimizer = torch.optim.SGD(model.parameters(),lr=0.01, weight_decay=1e-3, momentum=0.8)
load_checkpoint(optimizer, model, "SERFINAL-099.pkl")

# waveform = get_waveforms("03-01-08-01-01-01-01.wav")

# waveforms = np.array(waveform)


# mfc=librosa.feature.mfcc(
#         y=waveforms,
#         sr=48000,
#         n_mfcc=40,
#         n_fft=1024,
#         win_length=512,
#         window='hamming',
#         n_mels=128,
#         fmax=48000/2
#         )

# X = np.expand_dims(mfc, axis=1)
# X=np.expand_dims(X,axis=1)
# X = X.transpose(1, 2, 0,3) # assign the result back to arr
# X=torch.tensor(X)
# X=X.float()

# with torch.no_grad():

#             # set model to validation phase i.e. turn off dropout and batchnorm layers
#             model.eval()

#             # get the model's predictions on the validation set
#             output_logits, output_softmax = model(X)
#             predictions = torch.argmax(output_softmax,dim=1)

# pred = predictions.cpu().numpy()
# x=pred[0]
# x=str(x)
# emotions_dict[x]

import gradio as gr

def ser(audio_file):
  try:
    print("Step 1: Start processing")

    # sample_rate, audio_samples = audio_file
    # audio_samples = audio_samples.astype(np.float16)

    # audio_samples = audio_samples.astype(np.float32)
    waveform=get_waveforms(audio_file)
    # waveform, _ = librosa.load(audio_file, duration=3, offset=0.5, sr=sample_rate)
    print("Step 2: Audio data format check passed")
    # offset_samples = int(sample_rate * 0.5)  # Convert offset to samples
    # duration_samples = int(sample_rate * 3)  # Convert duration to samples
    # sliced_audio = audio_samples[offset_samples : offset_samples + duration_samples]
    # print(sliced_audio.shape)
    # waveform_homo = np.zeros((int(sample_rate*3,)))
    # waveform_homo[:144000] = audio_samples[:144000]
    # waveform=waveform[:144000]


    waveforms = np.array(waveform)


    mfc=librosa.feature.mfcc(
            y=waveforms,
            sr=48000,
            n_mfcc=40,
            n_fft=1024,
            win_length=512,
            window='hamming',
            n_mels=128,
            fmax=48000/2
            )

    X = np.expand_dims(mfc, axis=1)
    X=np.expand_dims(X,axis=1)
    X = X.transpose(1, 2, 0,3) # assign the result back to arr
    X=torch.tensor(X)
    X=X.float().cpu()
    model.to("cpu")


    with torch.no_grad():

                # set model to validation phase i.e. turn off dropout and batchnorm layers
                model.eval()
                # X = X.to(model.device)


                # get the model's predictions on the validation set
                output_logits, output_softmax = model(X)
                predictions = torch.argmax(output_softmax,dim=1)


    pred = predictions.cpu().numpy()
    x=pred[0]
    x=str(x)
    return emotions_dict.get(x, "Unknown")
  except Exception as e:
        return f"Error: {str(e)}"
demo = gr.Interface(
    fn=ser,
    inputs=gr.Audio(type="filepath"),
    outputs="text",
    theme="default",
    title="Speech Emotion Recognition",
    description="Upload a .wav file to detect emotion"
)
demo.launch()
