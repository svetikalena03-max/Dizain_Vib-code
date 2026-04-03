/**
 * MetallicPaint — vanilla WebGL2 (порт @react-bits / React Bits).
 * Контейнер: [data-metallic-paint], внутри <canvas class="paint-container">.
 */
(function () {
  "use strict";

  var vertexShader =
    "#version 300 es\n" +
    "precision highp float;\n" +
    "in vec2 a_position;\n" +
    "out vec2 vP;\n" +
    "void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}";

  var fragmentShader =
    "#version 300 es\n" +
    "precision highp float;\n" +
    "in vec2 vP;\n" +
    "out vec4 oC;\n" +
    "uniform sampler2D u_tex;\n" +
    "uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;\n" +
    "uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;\n" +
    "uniform float u_distort,u_contour;\n" +
    "uniform vec3 u_lightColor,u_darkColor,u_tint;\n" +
    "vec3 sC,sM;\n" +
    "vec3 pW(vec3 v){\n" +
    "  vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);\n" +
    "  return s*c*((h*16.-4.)*c-1.);\n" +
    "}\n" +
    "vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}\n" +
    "vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}\n" +
    "vec2 fA(){\n" +
    "  vec2 c=vP-.5;\n" +
    "  c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;\n" +
    "  c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;\n" +
    "  return vec2(c.x+.5,.5-c.y);\n" +
    "}\n" +
    "vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}\n" +
    "float bM(vec2 c,float t){\n" +
    "  vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);\n" +
    "  return l.x*l.y*u.x*u.y;\n" +
    "}\n" +
    "float mG(float hi,float lo,float t,float sh,float cv){\n" +
    "  sh*=(2.-u_sharp);\n" +
    "  float ci=smoothstep(.15,.85,cv),r=lo;\n" +
    "  float e1=.08/u_scale;\n" +
    "  r=mix(r,hi,smoothstep(0.,sh*1.5,t));\n" +
    "  r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));\n" +
    "  float e2=e1+.05/u_scale*(1.-ci*.35);\n" +
    "  r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));\n" +
    "  float e3=e2+.025/u_scale*(1.-ci*.45);\n" +
    "  r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));\n" +
    "  float e4=e1+.1/u_scale;\n" +
    "  r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));\n" +
    "  float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);\n" +
    "  r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));\n" +
    "  return r;\n" +
    "}\n" +
    "void main(){\n" +
    "  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;\n" +
    "  sM=fract(sC.zxy-sC.yzx*1.618);\n" +
    "  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);\n" +
    "  float angleRad=u_angle*3.14159/180.;\n" +
    "  sc=rot(sc-.5,angleRad)+.5;\n" +
    "  sc=clamp(sc,0.,1.);\n" +
    "  float sl=sc.x-sc.y,an=u_time*.001;\n" +
    "  vec2 iC=fA();\n" +
    "  vec4 texSample=texture(u_tex,iC);\n" +
    "  float dp=texSample.r;\n" +
    "  float shapeMask=texSample.a;\n" +
    "  vec3 hi=u_lightColor*u_bright;\n" +
    "  vec3 lo=u_darkColor*(2.-u_bright);\n" +
    "  lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;\n" +
    "  vec2 fC=sc-.5;\n" +
    "  float rd=length(fC+vec2(0.,sl*.15));\n" +
    "  vec2 ag=rot(fC,(.22-sl*.18)*3.14159);\n" +
    "  float cv=1.-pow(rd*1.65,1.15);\n" +
    "  cv*=pow(sc.y,.35);\n" +
    "  float vs=shapeMask;\n" +
    "  vs*=bM(iC,.01);\n" +
    "  float fr=pow(1.-cv,u_fresnel)*.3;\n" +
    "  vs=min(vs+fr*vs,1.);\n" +
    "  float mT=an*.0625;\n" +
    "  vec3 wO=vec3(-1.05,1.35,1.55);\n" +
    "  vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;\n" +
    "  vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;\n" +
    "  vec2 nC=sc*45.*u_noise;\n" +
    "  nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;\n" +
    "  vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;\n" +
    "  tC=lM(sC,tC);\n" +
    "  tC=lM(sC+1.618,tC);\n" +
    "  float tb=sin(tC.x*3.14159)*.5+.5;\n" +
    "  tb=tb*2.-1.;\n" +
    "  float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;\n" +
    "  float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);\n" +
    "  float lD=dp+(1.-dp)*u_liquid*tb;\n" +
    "  lD+=noiseVal*u_distort*.15*edgeFactor;\n" +
    "  float rB=clamp(1.-cv,0.,1.);\n" +
    "  float fl=ag.x+sl;\n" +
    "  fl+=noiseVal*sl*u_distort*edgeFactor;\n" +
    "  fl*=mix(1.,1.-dp*.5,u_contour);\n" +
    "  fl-=dp*u_contour*.8;\n" +
    "  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);\n" +
    "  fl-=tb*sl*1.8*eI;\n" +
    "  float cA=cv*clamp(pow(sc.y,.12),.25,1.);\n" +
    "  fl*=.12+(1.05-lD)*cA;\n" +
    "  fl*=smoothstep(1.,.65,lD);\n" +
    "  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y);\n" +
    "  float vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);\n" +
    "  fl+=vA1*.16+vA2*.025;\n" +
    "  fl*=.45+pow(sc.y,2.)*.55;\n" +
    "  fl*=u_scale;\n" +
    "  fl-=an;\n" +
    "  float rO=rB+cv*tb*.025;\n" +
    "  float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);\n" +
    "  float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);\n" +
    "  rO+=vM1*cM1*4.5;\n" +
    "  rO-=sl;\n" +
    "  float bO=rB*1.25;\n" +
    "  float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);\n" +
    "  float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);\n" +
    "  bO+=vM2*cM2*.9;\n" +
    "  bO-=lD*.18;\n" +
    "  rO*=u_refract*u_chroma;\n" +
    "  bO*=u_refract*u_chroma;\n" +
    "  float sf=u_blur;\n" +
    "  float rP=fract(fl+rO);\n" +
    "  float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);\n" +
    "  float gP=fract(fl);\n" +
    "  float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);\n" +
    "  float bP=fract(fl-bO);\n" +
    "  float bC=mG(hi.b,lo.b,bP,sf+.008,cv);\n" +
    "  vec3 col=vec3(rC,gC,bC);\n" +
    "  col=(col-.5)*u_contrast+.5;\n" +
    "  col=clamp(col,0.,1.);\n" +
    "  col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);\n" +
    "  col=clamp(col,0.,1.);\n" +
    "  oC=vec4(col*vs,vs);\n" +
    "}";

  function processImage(img) {
    var MAX_SIZE = 1000;
    var MIN_SIZE = 500;
    var width = img.naturalWidth || img.width;
    var height = img.naturalHeight || img.height;

    if (width > MAX_SIZE || height > MAX_SIZE || width < MIN_SIZE || height < MIN_SIZE) {
      var scale =
        width > height
          ? width > MAX_SIZE
            ? MAX_SIZE / width
            : width < MIN_SIZE
              ? MIN_SIZE / width
              : 1
          : height > MAX_SIZE
            ? MAX_SIZE / height
            : height < MIN_SIZE
              ? MIN_SIZE / height
              : 1;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    var canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;
    var size = width * height;
    var alphaValues = new Float32Array(size);
    var shapeMask = new Uint8Array(size);
    var boundaryMask = new Uint8Array(size);

    var i;
    for (i = 0; i < size; i++) {
      var idx = i * 4;
      var r = data[idx];
      var g = data[idx + 1];
      var b = data[idx + 2];
      var a = data[idx + 3];
      var isBackground = (r > 250 && g > 250 && b > 250 && a === 255) || a < 5;
      alphaValues[i] = isBackground ? 0 : a / 255;
      shapeMask[i] = alphaValues[i] > 0.1 ? 1 : 0;
    }

    var x, y, id;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        id = y * width + x;
        if (!shapeMask[id]) continue;
        if (
          x === 0 ||
          x === width - 1 ||
          y === 0 ||
          y === height - 1 ||
          !shapeMask[id - 1] ||
          !shapeMask[id + 1] ||
          !shapeMask[id - width] ||
          !shapeMask[id + width]
        ) {
          boundaryMask[id] = 1;
        }
      }
    }

    var u = new Float32Array(size);
    var ITERATIONS = 200;
    var C = 0.01;
    var omega = 1.85;

    var iter;
    for (iter = 0; iter < ITERATIONS; iter++) {
      for (y = 1; y < height - 1; y++) {
        for (x = 1; x < width - 1; x++) {
          id = y * width + x;
          if (!shapeMask[id] || boundaryMask[id]) continue;
          var sum =
            (shapeMask[id + 1] ? u[id + 1] : 0) +
            (shapeMask[id - 1] ? u[id - 1] : 0) +
            (shapeMask[id + width] ? u[id + width] : 0) +
            (shapeMask[id - width] ? u[id - width] : 0);
          var newVal = (C + sum) / 4;
          u[id] = omega * newVal + (1 - omega) * u[id];
        }
      }
    }

    var maxVal = 0;
    for (i = 0; i < size; i++) if (u[i] > maxVal) maxVal = u[i];
    if (maxVal === 0) maxVal = 1;

    var outData = ctx.createImageData(width, height);
    for (i = 0; i < size; i++) {
      var px = i * 4;
      var depth = u[i] / maxVal;
      var gray = Math.round(255 * (1 - depth * depth));
      outData.data[px] = outData.data[px + 1] = outData.data[px + 2] = gray;
      outData.data[px + 3] = Math.round(alphaValues[i] * 255);
    }

    return outData;
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1];
  }

  function readFloat(el, name, fallback) {
    var v = el.getAttribute(name);
    if (v === null || v === "") return fallback;
    var n = parseFloat(v);
    return isNaN(n) ? fallback : n;
  }

  function readBool(el, name, fallback) {
    var v = el.getAttribute(name);
    if (v === null || v === "") return fallback;
    return v === "true" || v === "1";
  }

  function initOne(wrap) {
    var imageSrc = wrap.getAttribute("data-image") || "images/metallic-logo.svg";
    var canvas = wrap.querySelector("canvas.paint-container");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.className = "paint-container";
      wrap.insertBefore(canvas, wrap.firstChild);
    }

    var staticImg = wrap.querySelector(".metallic-paint__static");
    if (staticImg && !staticImg.getAttribute("src")) staticImg.setAttribute("src", imageSrc);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrap.classList.add("metallic-paint--fallback");
      return;
    }

    var gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
    if (!gl) {
      wrap.classList.add("metallic-paint--fallback");
      return;
    }

    function compile(src, type) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("MetallicPaint shader:", gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    }

    var vs = compile(vertexShader, gl.VERTEX_SHADER);
    var fs = compile(fragmentShader, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      wrap.classList.add("metallic-paint--fallback");
      return;
    }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("MetallicPaint program:", gl.getProgramInfoLog(prog));
      wrap.classList.add("metallic-paint--fallback");
      return;
    }

    var uniforms = {};
    var count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    var ui;
    for (ui = 0; ui < count; ui++) {
      var info = gl.getActiveUniform(prog, ui);
      if (info) uniforms[info.name] = gl.getUniformLocation(prog, info.name);
    }

    var verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    gl.useProgram(prog);
    var pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    var texture = null;
    var imgDataRef = null;
    var rafId = null;
    var lastTime = 0;
    var animTime = 0;
    var speedRef = readFloat(wrap, "data-speed", 0.3);
    var mouseAnim = readBool(wrap, "data-mouse-animation", false);
    var mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
    var visible = true;
    var textureReady = false;

    function applyUniforms() {
      gl.useProgram(prog);
      gl.uniform1f(uniforms.u_seed, readFloat(wrap, "data-seed", 42));
      gl.uniform1f(uniforms.u_scale, readFloat(wrap, "data-scale", 4));
      gl.uniform1f(uniforms.u_refract, readFloat(wrap, "data-refraction", 0.01));
      gl.uniform1f(uniforms.u_blur, readFloat(wrap, "data-blur", 0.015));
      gl.uniform1f(uniforms.u_liquid, readFloat(wrap, "data-liquid", 0.75));
      gl.uniform1f(uniforms.u_bright, readFloat(wrap, "data-brightness", 2));
      gl.uniform1f(uniforms.u_contrast, readFloat(wrap, "data-contrast", 0.5));
      gl.uniform1f(uniforms.u_angle, readFloat(wrap, "data-angle", 0));
      gl.uniform1f(uniforms.u_fresnel, readFloat(wrap, "data-fresnel", 1));
      gl.uniform1f(uniforms.u_sharp, readFloat(wrap, "data-pattern-sharpness", 1));
      gl.uniform1f(uniforms.u_wave, readFloat(wrap, "data-wave-amplitude", 1));
      gl.uniform1f(uniforms.u_noise, readFloat(wrap, "data-noise-scale", 0.5));
      gl.uniform1f(uniforms.u_chroma, readFloat(wrap, "data-chromatic-spread", 2));
      gl.uniform1f(uniforms.u_distort, readFloat(wrap, "data-distortion", 1));
      gl.uniform1f(uniforms.u_contour, readFloat(wrap, "data-contour", 0.2));

      var light = hexToRgb(wrap.getAttribute("data-light-color") || "#ffffff");
      var dark = hexToRgb(wrap.getAttribute("data-dark-color") || "#000000");
      var tint = hexToRgb(wrap.getAttribute("data-tint-color") || "#c9b8ff");
      gl.uniform3f(uniforms.u_lightColor, light[0], light[1], light[2]);
      gl.uniform3f(uniforms.u_darkColor, dark[0], dark[1], dark[2]);
      gl.uniform3f(uniforms.u_tint, tint[0], tint[1], tint[2]);
    }

    function uploadTexture(imgData) {
      if (!imgData) return;
      if (texture) gl.deleteTexture(texture);
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        imgData.width,
        imgData.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        imgData.data
      );
      gl.useProgram(prog);
      gl.uniform1i(uniforms.u_tex, 0);
      var ratio = imgData.width / imgData.height;
      gl.uniform1f(uniforms.u_imgRatio, ratio);
      imgDataRef = imgData;
      textureReady = true;
    }

    function resizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = wrap.getBoundingClientRect();
      var cw = Math.max(2, Math.floor(rect.width * dpr));
      var ch = Math.max(2, Math.floor(rect.height * dpr));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        gl.viewport(0, 0, cw, ch);
        gl.useProgram(prog);
        gl.uniform1f(uniforms.u_ratio, cw / ch);
      }
    }

    function onMouseMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left) / rect.width;
      mouse.targetY = (e.clientY - rect.top) / rect.height;
    }

    function render(time) {
      if (!visible || !textureReady) {
        rafId = null;
        return;
      }

      var delta = time - lastTime;
      lastTime = time;

      if (mouseAnim) {
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;
        animTime = mouse.x * 3000 + mouse.y * 1500;
      } else {
        animTime += delta * speedRef;
      }

      gl.useProgram(prog);
      gl.uniform1f(uniforms.u_time, animTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    }

    function tryStart() {
      if (!textureReady || !visible || rafId !== null) return;
      lastTime = performance.now();
      rafId = requestAnimationFrame(render);
    }

    function stopLoop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    var img = new Image();
    img.onload = function () {
      try {
        var imgData = processImage(img);
        resizeCanvas();
        uploadTexture(imgData);
        applyUniforms();
        gl.uniform1f(uniforms.u_ratio, canvas.width / Math.max(1, canvas.height));
        if (mouseAnim) canvas.addEventListener("mousemove", onMouseMove);
        tryStart();
      } catch (e) {
        console.warn("MetallicPaint:", e);
        wrap.classList.add("metallic-paint--fallback");
      }
    };
    img.onerror = function () {
      wrap.classList.add("metallic-paint--fallback");
    };
    img.src = imageSrc;

    var ro = new ResizeObserver(function () {
      resizeCanvas();
      if (imgDataRef && gl && prog) {
        gl.useProgram(prog);
        gl.uniform1f(uniforms.u_ratio, canvas.width / Math.max(1, canvas.height));
      }
    });
    ro.observe(wrap);

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible = entry.isIntersecting;
          if (visible) tryStart();
          else stopLoop();
        });
      },
      { rootMargin: "80px", threshold: 0 }
    );
    io.observe(wrap);

    window.addEventListener(
      "beforeunload",
      function () {
        stopLoop();
        ro.disconnect();
        io.disconnect();
        if (texture) gl.deleteTexture(texture);
        if (mouseAnim) canvas.removeEventListener("mousemove", onMouseMove);
      },
      { once: true }
    );
  }

  function boot() {
    document.querySelectorAll("[data-metallic-paint]").forEach(initOne);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
