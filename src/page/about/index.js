import {html} from '../../../lib/html';
import {Page} from '../../../lib/page';
import {CONSTANT} from '../../resource/constant';
import {jumbotron} from '../../scripts/jumbotron';
import style from '../../styles/about.module.scss';

export class AboutPage extends Page {
  title = CONSTANT.PAGE.ABOUT.TITLE;
  path = CONSTANT.PAGE.ABOUT.PATH;
  create() {
    super.create();

    jumbotron.changeView(jumbotron.Class.VIEW_MODE.SMALL);

    this.setContent(
        /**/html`
          <section>
          <div class="${style.wrapper}">
            <div class="${style.imgWrapper}">
              <div class="${style.img}">
                <i class="md-icons ${style.person}">person</i>
              </div>
              <h1 class="${style.title}">Anas Mubarak Yasin</h1>
              <p class="${style.description}">Food Hunt just mini project</p>
            </div>
            <div class="${style.content}">
              <div class="${style.link}">
                <h1 class="${style.title}">Links</h1>
                <h2 class="${style.subtitle}">Repository</h2>
                <div class="${style.list}">
                  <div class="${style.item}">
                    <a class="${style.link}" href="https://github.com/AnasMubarakYasin?tab=repositories">
                      <span class="${style.text}">https://github.com/AnasMubarakYasin?tab=repositories</span>
                    </a>
                  </div>
                </div>
                <h2 class="${style.subtitle}">Design</h2>
                <div class="${style.list}">
                  <div class="${style.item}">
                    <a class="${style.link}" href="https://xd.adobe.com/view/5a937bad-54a5-4427-88e9-d196a5f8711e-0fc0/">
                      <span class="${style.text}">https://xd.adobe.com/view/5a937bad-54a5-4427-88e9-d196a5f8711e-0fc0/</span>
                    </a>
                  </div>
                </div>
              </div>
              <div class="${style.tech}">
                <h1 class="${style.title}">Technology</h1>
                <h2 class="${style.subtitle}">language</h2>
                <div class="${style.list}">
                  <div class="${style.item}">
                    <i class="custom-icons html5"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons css3"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons javascript"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons sass scss"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons typescript"></i>
                  </div>
                </div>
                <h2 class="${style.subtitle}">Tools</h2>
                <div class="${style.list}">
                  <div class="${style.item}">
                    <i class="custom-icons node-dot-js"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons npm"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons webpack"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons visualstudiocode"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons git"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons github"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons googlechrome"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons adobexd"></i>
                  </div>
                  <div class="${style.item}">
                    <i class="custom-icons inkscape"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </section>`,
    );
  }
  destroy() {
    super.destroy();

    jumbotron.changeView(jumbotron.Class.VIEW_MODE.DEFAULT);
  }
}
