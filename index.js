const { Layer, Network } = window.synaptic;

// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
// extract from chromium source code by @liuwayong

function onDocumentLoad() {
    R = new Runner('.interstitial-wrapper');
}

document.addEventListener('DOMContentLoaded', onDocumentLoad);
